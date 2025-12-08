'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { createSession, getSession, logout } from './lib/auth' 

const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

// ============================================================================
// 1. AUTENTICAÇÃO
// ============================================================================

export async function loginAction(email, password) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "Usuário não encontrado." };

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return { error: "Senha incorreta." };

    await createSession({ id: user.id, name: user.name, role: user.role, email: user.email });
    return { success: true, user };
  } catch (e) {
    console.error("Erro no login:", e);
    return { error: "Erro no servidor." };
  }
}

export async function logoutAction() {
  await logout();
  revalidatePath('/');
}

export async function checkSessionAction() {
  const session = await getSession();
  return session ? session.user : null;
}

// ============================================================================
// 2. LEITURA DE DADOS (COM CORREÇÃO PARA SQLITE)
// ============================================================================

export async function getInitialData() {
  const users = await prisma.user.findMany()
  const veiculos = await prisma.veiculo.findMany()
  
  const viagensRaw = await prisma.viagem.findMany({
    include: {
      messages: { include: { sender: true } },
      cliente: true,
      motorista: true
    },
    orderBy: { updatedAt: 'desc' }
  })

  // CORREÇÃO SQLITE: Converte as Strings do banco de volta para JSON (Objetos)
  const viagens = viagensRaw.map(v => ({
      ...v,
      checklist: v.checklist ? JSON.parse(v.checklist) : null,
      history: v.history ? JSON.parse(v.history) : []
  }));

  const formattedMessages = viagens.flatMap(v => 
    v.messages.map(m => ({
      id: m.id,
      viagemId: v.id,
      senderId: m.senderId,
      senderName: m.sender.name,
      text: m.text,
      timestamp: m.timestamp.toISOString()
    }))
  )

  return { 
    users: JSON.parse(JSON.stringify(users)), 
    veiculos, 
    viagens: JSON.parse(JSON.stringify(viagens)), 
    messages: JSON.parse(JSON.stringify(formattedMessages))
  }
}

// ============================================================================
// 3. AÇÕES OPERACIONAIS (SALVANDO COMO STRING)
// ============================================================================

export async function criarViagemAction(data) {
  await prisma.viagem.create({
    data: {
      codigo: `CL-${Math.floor(Math.random() * 10000)}`,
      descricao: data.desc,
      valor: parseFloat(data.valor),
      origem: data.origem, 
      destino: data.destino,
      lat: data.lat,
      lng: data.lng,
      destLat: data.destLat,
      destLng: data.destLng,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      status: 'pendente',
      clienteId: parseInt(data.clienteId),
      // SQLITE FIX: Salva como String
      checklist: JSON.stringify({ pneus: false, oleo: false, carga_presa: false, documentacao: false }),
      history: JSON.stringify([{ status: 'pendente', date: new Date(), descricao: 'Criado no sistema' }])
    }
  })
  revalidatePath('/')
}

export async function atualizarViagemAction(id, data) {
  const viagemAtual = await prisma.viagem.findUnique({ where: { id: parseInt(id) } });
  
  // SQLITE FIX: Lê como string, converte pra array, adiciona item, salva como string
  let novoHistorico = viagemAtual.history ? JSON.parse(viagemAtual.history) : [];
  
  if (data.status && data.status !== viagemAtual.status) {
    const labels = { 'pendente': 'Aguardando Motorista', 'em rota': 'Motorista em Trânsito', 'entregue': 'Entrega Realizada', 'cancelado': 'Operação Cancelada' };
    novoHistorico.push({
      status: data.status,
      descricao: labels[data.status] || 'Atualização de Status',
      date: new Date()
    });
  }

  const dadosParaSalvar = { ...data };
  if (data.avaliacao !== undefined) { dadosParaSalvar.rating = parseInt(data.avaliacao); delete dadosParaSalvar.avaliacao; }
  if (data.comentario !== undefined) { dadosParaSalvar.feedback = data.comentario; delete dadosParaSalvar.comentario; }
  
  // Remove campos que não existem na tabela direta se vierem
  if (data.checklist) dadosParaSalvar.checklist = JSON.stringify(data.checklist);

  await prisma.viagem.update({
    where: { id: parseInt(id) },
    data: { ...dadosParaSalvar, history: JSON.stringify(novoHistorico), updatedAt: new Date() }
  })
  revalidatePath('/')
}

export async function enviarMensagemAction(viagemId, senderId, text) {
  await prisma.message.create({
    data: { viagemId: parseInt(viagemId), senderId: parseInt(senderId), text: text }
  })
  revalidatePath('/')
}

export async function criarVeiculoAction(data) {
  await prisma.veiculo.create({ data })
  revalidatePath('/')
}

export async function criarUsuarioAction(data) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  await prisma.user.create({ 
      data: { ...data, password: hashedPassword } 
  })
  revalidatePath('/')
}

export async function popularBancoAction() {
  const hashedPassword = await bcrypt.hash("123", 10);

  const usersSeed = [
    { name: "Admin Geral", email: "admin", password: hashedPassword, role: "admin", cnpj: "00.000.000/0001-91", company: "CAIOLOG" },
    { name: "Magazine Luiza", email: "magalu", password: hashedPassword, role: "cliente", cnpj: "47.960.950/0001-21", company: "Magazine Luiza S.A." },
    { name: "Carlos Motorista", email: "carlos", password: hashedPassword, role: "motorista", cnpj: "12345678900", phone: "(11) 98888-8888" },
    { name: "Americanas S.A.", email: "americanas", password: hashedPassword, role: "cliente", cnpj: "33.000.118/0001-36", company: "Americanas" }
  ];

  for (const u of usersSeed) {
    const existe = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existe) { await prisma.user.create({ data: u }); }
  }
  
  // Veículos (sem alterações necessárias)
  const veiculosSeed = [
    { placa: "ABC-1234", modelo: "Fiat Fiorino", tipo: "Furgão", capacidade: "800kg", status: "ativo", ano: 2022 },
    { placa: "XYZ-9876", modelo: "Mercedes Atego", tipo: "Caminhão", capacidade: "5ton", status: "ativo", ano: 2021 }
  ];

  for (const v of veiculosSeed) {
    const existe = await prisma.veiculo.findUnique({ where: { placa: v.placa } });
    if (!existe) { await prisma.veiculo.create({ data: v }); }
  }

  revalidatePath('/');
  return { success: true };
}