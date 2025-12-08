"use client";

import { useState } from "react";
import styles from "./styles/landing.module.css"; 

// Configurações
const WHATSAPP_LINK = "https://wa.me/558185219181?text=Olá,%20tenho%20interesse%20na%20solução%20Caiolog.";

// --- ÍCONES SVG PROFISSIONAIS (Enterprise Grade) ---
const Icons = {
    Menu: () => <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
    Close: () => <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Tower: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>,
    Truck: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>,
    Mobile: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>,
    ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16, marginLeft:5}}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
};

export default function LandingPage({ onEnterSystem }) {
    
    const [activeFeature, setActiveFeature] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // DADOS DAS SOLUÇÕES
    const features = [
        {
            id: 0,
            icon: <Icons.Tower />,
            title: "Torre de Controle",
            text: "Visão panorâmica (360º) de toda a operação. Acompanhe status, telemetria e KPIs financeiros em tempo real com precisão absoluta.",
            detail: "Dashboards customizáveis que centralizam dados de múltiplas filiais em uma única tela gerencial."
        },
        {
            id: 1,
            icon: <Icons.Truck />,
            title: "Frota Inteligente",
            text: "Gestão proativa de ativos. Manutenção preditiva, controle de combustível e checklist digital obrigatório que garante a segurança da carga.",
            detail: "Alertas automáticos de vencimento de CNH, IPVA e revisões preventivas para evitar paradas não planejadas."
        },
        {
            id: 2,
            icon: <Icons.Mobile />,
            title: "Portal Mobile",
            text: "Interface web responsiva otimizada para o dia a dia. O motorista visualiza rotas, aceita corridas e valida entregas direto pelo navegador.",
            detail: "Acesso universal e imediato, sem necessidade de baixar ou instalar aplicativos pesados. Compatível com qualquer smartphone."
        }
    ];

    return (
        <div className={styles.container}>
            
            {/* --- NAVBAR RESPONSIVA --- */}
            <nav className={styles.navbar}>
                <div style={{display:'flex', alignItems:'center', gap: 10}}>
                    {/* LOGO MAIOR E COM DESTAQUE */}
                    <img src="/logo.png" alt="CAIOLOG" className={styles.brandLogo} />
                </div>

                {/* Desktop Menu */}
                <div className={styles.navLinksDesktop}>
                    <a href="#solucoes" className={styles.navLink}>Soluções</a>
                    <a href="#sobre" className={styles.navLink}>A Empresa</a>
                    <a href={WHATSAPP_LINK} target="_blank" className={styles.navLink}>Fale com Vendas</a>
                    <button onClick={onEnterSystem} className={styles.btnLogin}>
                        ÁREA DO CLIENTE
                    </button>
                </div>

                {/* Mobile Hamburger */}
                <button className={styles.hamburger} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <Icons.Close /> : <Icons.Menu />}
                </button>
            </nav>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className={styles.mobileMenu}>
                    <a href="#solucoes" className={styles.navLink} onClick={()=>setIsMenuOpen(false)}>Soluções</a>
                    <a href="#sobre" className={styles.navLink} onClick={()=>setIsMenuOpen(false)}>A Empresa</a>
                    <a href={WHATSAPP_LINK} className={styles.navLink} onClick={()=>setIsMenuOpen(false)}>Falar com Vendas</a>
                    <hr style={{borderColor:'#e2e8f0', margin:0}}/>
                    <button onClick={()=>{setIsMenuOpen(false); onEnterSystem();}} className={styles.btnLogin} style={{width:'100%', textAlign:'center'}}>
                        ACESSAR SISTEMA
                    </button>
                </div>
            )}

            {/* --- HERO SECTION --- */}
            <header className={styles.heroSection}>
                <div className={styles.bgGrid}></div>
                
                <div className={styles.heroContent}>
                    <div className={`${styles.heroAnimate} fade-in-up`}>
                        <span className={styles.tagline}>CAIOLOG SOLUÇÕES EM LOGÍSTICA</span>
                    </div>

                    <h1 className={`${styles.heroTitle} animateFadeInUp`}>
                        O sistema operacional<br/>
                        da sua <span style={{color: '#3b82f6'}}>logística.</span>
                    </h1>
                    
                    <p className={`${styles.heroText} animateFadeInUp`} style={{animationDelay: '0.2s'}}>
                        Elimine planilhas e pontos cegos. Unificamos rastreamento, gestão de frotas e inteligência de dados em um único ecossistema seguro e escalável.
                    </p>
                    
                    <div className={`${styles.ctaGroup} animateFadeInUp`} style={{animationDelay: '0.4s'}}>
                        <button onClick={onEnterSystem} className={styles.btnPrimary}>
                            Começar Agora
                        </button>
                        <a href={WHATSAPP_LINK} target="_blank" className={styles.btnOutline}>
                            Agendar Demo
                        </a>
                    </div>
                </div>
            </header>

            {/* --- PARTNERS --- */}
            <div className={styles.partnersSection}>
                <div className={styles.maxWidth}>
                    <p style={{textAlign:'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5}}>
                        Empresas Parceiras
                    </p>
                    <div className={styles.partnersGrid}>
                        <img src="/magalu.png" alt="Magalu" className={styles.partnerLogo} />
                        <img src="/americanas.png" alt="Americanas" className={styles.partnerLogo} />
                        <img src="/mercadolivre.png" alt="Mercado Livre" className={styles.partnerLogo} />
                        <img src="/casasbahia.png" alt="Casas Bahia" className={styles.partnerLogo} />
                        <img src="/correios.svg" alt="Correios" className={styles.partnerLogo} />
                    </div>
                </div>
            </div>

            {/* --- SOLUÇÕES (TABS) --- */}
            <section id="solucoes" className={styles.section} style={{background: 'white'}}>
                <div className={styles.maxWidth}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Plataforma Unificada</h2>
                        <p className={styles.sectionSubtitle}>
                            Uma suíte completa de ferramentas desenhadas para escalar operações complexas sem perder o controle.
                        </p>
                    </div>

                    <div className={styles.tabsContainer}>
                        {/* Tab Buttons */}
                        <div className={styles.tabButtons}>
                            {features.map((feature) => (
                                <button 
                                    key={feature.id} 
                                    onClick={() => setActiveFeature(feature.id)}
                                    className={`${styles.tabBtn} ${activeFeature === feature.id ? styles.tabBtnActive : ''}`}
                                >
                                    {feature.icon}
                                    {feature.title}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className={styles.tabContent} key={activeFeature}>
                            <div className={styles.tabIconArea}>
                                {features[activeFeature].icon}
                            </div>
                            
                            <div className={styles.tabText}>
                                <h3>{features[activeFeature].title}</h3>
                                <p style={{color: '#475569', lineHeight: 1.7, fontSize: 16, marginBottom: 20}}>
                                    {features[activeFeature].text}
                                </p>
                                <div className={styles.detailBox}>
                                    <strong style={{color: '#1e293b', display: 'block', marginBottom: 5, fontSize: 14}}>Destaque Técnico:</strong>
                                    <span style={{color: '#64748b', fontSize: 14}}>{features[activeFeature].detail}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SOBRE NÓS --- */}
            <section id="sobre" className={styles.section}>
                <div className={styles.maxWidth} style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 70, alignItems: 'center'}}>
                    <div>
                        <span style={{color: '#3b82f6', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 12}}>Sobre a CAIOLOG</span>
                        <h2 className={styles.sectionTitle} style={{textAlign:'left', margin:'15px 0 25px'}}>
                            Escalabilidade com<br/>DNA Tecnológico.
                        </h2>
                        <p style={{color: '#475569', lineHeight: 1.8, marginBottom: 25}}>
                            Não somos apenas uma transportadora. Somos uma tech-logistics que utiliza algoritmos proprietários para resolver o caos da distribuição urbana.
                        </p>
                        
                        <div style={{display: 'flex', gap: 50, borderTop: '1px solid #e2e8f0', paddingTop: 30}}>
                            <div>
                                <div style={{fontSize: 32, fontWeight: 800, color: '#0f172a'}}>15k+</div>
                                <div style={{fontSize: 13, fontWeight: 600, color: '#64748b', textTransform:'uppercase'}}>Entregas/Mês</div>
                            </div>
                            <div>
                                <div style={{fontSize: 32, fontWeight: 800, color: '#0f172a'}}>99.8%</div>
                                <div style={{fontSize: 13, fontWeight: 600, color: '#64748b', textTransform:'uppercase'}}>SLA Atendido</div>
                            </div>
                        </div>
                    </div>
                    <div style={{position: 'relative'}}>
                        <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop" style={{width: '100%', borderRadius: 12, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'}} alt="Equipe Caiolog" />
                    </div>
                </div>
            </section>

            {/* --- PRE-FOOTER (NOVO) --- */}
            <div className={styles.preFooter}>
                <div className={styles.maxWidth}>
                    <h2 style={{fontSize: 32, fontWeight: 800, marginBottom: 20}}>Pronto para otimizar sua operação?</h2>
                    <p style={{color: '#cbd5e1', marginBottom: 40, maxWidth: 600, margin: '0 auto 40px'}}>
                        Junte-se às empresas que reduziram custos operacionais em média 23% no primeiro ano.
                    </p>
                    <button onClick={onEnterSystem} className={styles.btnPrimary} style={{padding: '16px 50px'}}>
                        Acessar Plataforma <Icons.ArrowRight />
                    </button>
                </div>
            </div>

            {/* --- FOOTER --- */}
            <footer className={styles.footer}>
                <div className={`${styles.maxWidth} ${styles.footerGrid}`}>
                    <div className={styles.footerCol}>
                        {/* LOGO NO FOOTER - BRANCA E NÍTIDA */}
                        <img src="/logo.png" alt="CAIOLOG" className={styles.footerLogo} />
                        <p style={{fontSize: 14, lineHeight: 1.6}}>
                            Inteligência logística para empresas que não podem parar.
                        </p>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>PRODUTO</h4>
                        <a href="#" className={styles.footerLink}>Roteirizador</a>
                        <a href="#" className={styles.footerLink}>Gestão de Frotas</a>
                        <a href="#" className={styles.footerLink}>API para Devs</a>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>EMPRESA</h4>
                        <a href="#" className={styles.footerLink}>Sobre Nós</a>
                        <a href="#" className={styles.footerLink}>Carreiras</a>
                        <a href={WHATSAPP_LINK} className={styles.footerLink}>Contato</a>
                    </div>

                    <div className={styles.footerCol}>
                        <h4>LEGAL</h4>
                        <a href="#" className={styles.footerLink}>Privacidade</a>
                        <a href="#" className={styles.footerLink}>Termos de Uso</a>
                        <a href="#" className={styles.footerLink}>Compliance</a>
                    </div>
                </div>

                <div style={{maxWidth: 1200, margin: '60px auto 0', borderTop: '1px solid #1e293b', paddingTop: 30, textAlign: 'center', fontSize: 12, opacity: 0.6, paddingBottom: 20}}>
                    &copy; {new Date().getFullYear()} CAIOLOG Logistics. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    );
}