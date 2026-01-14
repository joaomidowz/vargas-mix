# 🔫 Vargas Mix System V2.0

> Sistema profissional de gerenciamento de partidas de CS2 (In-house/Mix), com ranking automático, balanceamento de times e estatísticas em tempo real.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Turso](https://img.shields.io/badge/Turso-Database-44c9a3) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

## 📋 Sobre o Projeto

O **Vargas Mix System** foi desenvolvido para automatizar e profissionalizar a organização de partidas privadas de Counter-Strike 2. O sistema substitui planilhas manuais e sorteios de papel por um algoritmo inteligente que gerencia filas, sorteia times equilibrados e mantém um histórico estatístico de todos os jogadores.

## ✨ Funcionalidades Principais

### 🎮 Lobby & Gerenciamento de Times
* **Algoritmo de Fila Inteligente:** O sorteio não é apenas aleatório. Ele prioriza jogadores que:
    1.  São **Subs** (Apoiadores ⭐).
    2.  Jogaram há mais tempo ou acabaram de chegar (Rotação Justa).
* **Modo "Aleatório":** Sorteia todos os times balanceando a ordem de chegada.
* **Modo "Desafio Vargão":** Permite fixar uma "Panela" contra desafiantes rotativos.
* **Sistema de Subs (⭐):** Jogadores marcados como "Sub" têm prioridade visual e de fila na montagem dos times.

### 📊 Estatísticas & Ranking (Hall da Fama)
* **Leaderboard Automático:** Tabela atualizada em tempo real com Vitórias, Derrotas e Winrate (%).
* **Fire Streak (🔥):** Jogadores com 2 ou mais vitórias seguidas ganham destaque visual.
* **Estatísticas de Mapas:** Gráfico visual dos mapas mais jogados pela comunidade.
* **Histórico Detalhado:** Registro de todas as partidas passadas com placar, data e escalação (Line-up), com opção de exclusão.

### 🛡️ Segurança & Admin
* **Auth Gate (Portaria):** O site é protegido por uma senha global (`NEXT_PUBLIC_SITE_PASSWORD`), impedindo acesso de curiosos externos.
* **Proteção do Vargão:** O admin principal (Vargas) possui proteção no banco de dados e não pode ser excluído acidentalmente.
* **Painel Admin (Zona de Perigo):** Área restrita protegida por senha secundária para **Resetar a Season** (Zerar ranking e histórico).

### 🎨 UI/UX
* **Map Veto System:** Interface interativa para votação e veto de mapas antes da partida.
* **Design Responsivo:** Funciona perfeitamente em Desktop e Mobile.
* **Dark Mode:** Interface moderna e escura inspirada na identidade visual gamer.
* **Alertas Modais:** Confirmações de segurança (Excluir jogador/partida) via Modal, sem pop-ups nativos feios.

---

## 🚀 Tecnologias Utilizadas

* **Front-end:** [Next.js 14](https://nextjs.org/) (App Router & Server Actions)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
* **Banco de Dados:** [Turso](https://turso.tech/) (LibSQL)
* **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
* **Deploy:** [Vercel](https://vercel.com/)

---

## ⚙️ Configuração Local

Siga estes passos para rodar o projeto na sua máquina:

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/SEU_USUARIO/vargas-mix.git](https://github.com/SEU_USUARIO/vargas-mix.git)
    cd vargas-mix
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env.local` na raiz do projeto e adicione suas chaves:

    ```env
    # Conexão com o Banco de Dados (Turso)
    DATABASE_URL="libsql://sua-url-do-turso.turso.io"
    DATABASE_AUTH_TOKEN="seu-token-gigante-do-turso"

    # Senha de Acesso ao Site (Portaria)
    NEXT_PUBLIC_SITE_PASSWORD="senha-para-entrar-no-site"

    # Senha de Admin (Para resetar o sistema)
    ADMIN_PASSWORD="senha-do-admin"
    ```

4.  **Sincronize o Banco de Dados:**
    ```bash
    npx drizzle-kit push
    ```

5.  **Rode o projeto:**
    ```bash
    npm run dev
    ```
    Acesse `http://localhost:3000` no seu navegador.

---

## 📂 Estrutura do Banco de Dados

O projeto utiliza 3 tabelas principais:

* `players`: Armazena nome, stats (v/d/streak), status de Sub e data da última partida.
* `matches`: Histórico das partidas, placar, mapas e line-ups (serializados).
* `maps`: Lista de mapas disponíveis e suas imagens de fundo.

---

## 🤝 Contribuição

Este é um projeto privado para a comunidade Vargas Mix. Pull Requests são bem-vindos apenas de membros autorizados.

## 📝 Licença

Desenvolvido para uso exclusivo para mix do Vargas no CS2.
