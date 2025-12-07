'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// Instância global do Prisma para evitar "Too many connections" em dev
const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

// --- LEITURA DE DADOS (Chamado pelo page.js) ---
export async function getInitialData() {
  const users = await prisma.user.findMany()
  const veiculos = await prisma.veiculo.findMany()
  
  const viagens = await prisma.viagem.findMany({
    include: {
      messages: { include: { sender: true } }, // Traz mensagens e quem enviou
      cliente: true,
      motorista: true
    },
    orderBy: { updatedAt: 'desc' }
  })

  // Formatando mensagens para o formato que seu frontend espera
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
    users, 
    veiculos, 
    viagens: JSON.parse(JSON.stringify(viagens)), // Serialização para o Client Component
    messages: JSON.parse(JSON.stringify(formattedMessages))
  }
}

// --- AÇÕES DE CRIAÇÃO E ATUALIZAÇÃO ---

export async function criarViagemAction(data) {
  await prisma.viagem.create({
    data: {
      codigo: `CL-${Math.floor(Math.random() * 10000)}`,
      descricao: data.desc,
      valor: parseFloat(data.valor),
      origem: `${data.origemCidade} - ${data.origemUF}`,
      destino: `${data.destinoCidade} - ${data.destinoUF}`,
      lat: data.lat,
      lng: data.lng,
      destLat: data.destLat,
      destLng: data.destLng,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      status: 'pendente',
      clienteId: parseInt(data.clienteId),
      checklist: { pneus: false, oleo: false, carga_presa: false, documentacao: false },
      history: [{ status: 'pendente', date: new Date(), descricao: 'Criado no sistema' }]
    }
  })
  revalidatePath('/')
}

export async function atualizarViagemAction(id, data) {
  await prisma.viagem.update({
    where: { id: parseInt(id) },
    data: {
      ...data,
      updatedAt: new Date()
    }
  })
  revalidatePath('/')
}

export async function enviarMensagemAction(viagemId, senderId, text) {
  await prisma.message.create({
    data: {
      viagemId: parseInt(viagemId),
      senderId: parseInt(senderId),
      text: text
    }
  })
  revalidatePath('/')
}

export async function criarVeiculoAction(data) {
  await prisma.veiculo.create({ data })
  revalidatePath('/')
}

export async function criarUsuarioAction(data) {
  await prisma.user.create({ data })
  revalidatePath('/')
}

// --- AÇÃO DE CARGA INICIAL (SEED) ---
// Função Essencial para popular o Banco Neon vazio com seus dados de teste
export async function popularBancoAction() {
  // 1. Criar Usuários
  const usersSeed = [
    { name: "Admin Geral", email: "admin", password: "123", role: "admin", cnpj: "00.000.000/0001-91", company: "CAIOLOG" },
    { name: "Magazine Luiza", email: "magalu", password: "123", role: "cliente", cnpj: "47.960.950/0001-21", company: "Magazine Luiza S.A." },
    { name: "Carlos Motorista", email: "carlos", password: "123", role: "motorista", cnpj: "12345678900", phone: "(11) 98888-8888" },
    { name: "Americanas S.A.", email: "americanas", password: "123", role: "cliente", cnpj: "33.000.118/0001-36", company: "Americanas" }
  ];

  for (const u of usersSeed) {
    const existe = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existe) {
      await prisma.user.create({ data: u });
    }
  }

  // 2. Criar Veículos
  const veiculosSeed = [
    { placa: "ABC-1234", modelo: "Fiat Fiorino", tipo: "Furgão", capacidade: "800kg", status: "ativo", ano: 2022 },
    { placa: "XYZ-9876", modelo: "Mercedes Atego", tipo: "Caminhão", capacidade: "5ton", status: "ativo", ano: 2021 }
  ];

  for (const v of veiculosSeed) {
    const existe = await prisma.veiculo.findUnique({ where: { placa: v.placa } });
    if (!existe) {
      await prisma.veiculo.create({ data: v });
    }
  }

  // 3. Criar uma Viagem de Exemplo (Só se não tiver nenhuma)
  const totalViagens = await prisma.viagem.count();
  if (totalViagens === 0) {
    const clienteMagalu = await prisma.user.findUnique({ where: { email: 'magalu' } });
    const motoraCarlos = await prisma.user.findUnique({ where: { email: 'carlos' } });

    if (clienteMagalu && motoraCarlos) {
      await prisma.viagem.create({
        data: {
          codigo: "CL-9981",
          descricao: "Lote de Notebooks Dell - 50 unidades",
          valor: 45000,
          origem: "São Paulo - SP",
          destino: "Rio de Janeiro - RJ",
          lat: -23.55, lng: -46.63,
          destLat: -22.90, destLng: -43.17,
          otp: "9988",
          peso: "350kg",
          status: "pendente",
          clienteId: clienteMagalu.id,
          motoristaId: motoraCarlos.id,
          checklist: { pneus: false, oleo: false, carga_presa: false, documentacao: false },
          history: [{status: 'pendente', date: new Date(), descricao: 'Importado do sistema antigo'}]
        }
      });
    }
  }

  revalidatePath('/');
  return { success: true };
}