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
      senderName: m.sender.name, // Simplificação
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
  // Se tiver histórico novo, precisamos adicionar ao existente (lógica simplificada)
  // Nota: Em produção, faríamos um push no array JSON, aqui substituímos
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