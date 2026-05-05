-- ============================================================
--  UniTask — Script de Criação do Banco de Dados
--  Versão: 1.0  |  Abril de 2026
--  Derivado do DER versão 1.0
-- ============================================================

-- Criação do banco
CREATE DATABASE IF NOT EXISTS unitask
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE unitask;

-- ============================================================
--  TABELA: usuario
--  Armazena os dados dos usuários cadastrados no sistema.
-- ============================================================
CREATE TABLE usuario (
    id_usuario  INT             NOT NULL AUTO_INCREMENT,
    nome        VARCHAR(100)    NOT NULL,
    email       VARCHAR(150)    NOT NULL,
    senha_hash  VARCHAR(255)    NOT NULL,
    criado_em   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_usuario PRIMARY KEY (id_usuario),
    CONSTRAINT uk_usuario_email UNIQUE (email)
);

-- ============================================================
--  TABELA: grupo
--  Armazena os grupos de trabalho acadêmico.
-- ============================================================
CREATE TABLE grupo (
    id_grupo        INT             NOT NULL AUTO_INCREMENT,
    id_admin        INT             NOT NULL,
    nome            VARCHAR(100)    NOT NULL,
    descricao       TEXT,
    codigo_convite  VARCHAR(20)     NOT NULL,
    criado_em       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_grupo PRIMARY KEY (id_grupo),
    CONSTRAINT uk_grupo_codigo UNIQUE (codigo_convite),
    CONSTRAINT fk_grupo_admin FOREIGN KEY (id_admin)
        REFERENCES usuario (id_usuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================================
--  TABELA: tarefa
--  Armazena as tarefas criadas pelos usuários.
-- ============================================================
CREATE TABLE tarefa (
    id_tarefa       INT             NOT NULL AUTO_INCREMENT,
    id_usuario      INT             NOT NULL,
    titulo          VARCHAR(100)    NOT NULL,
    descricao       TEXT,
    prioridade      ENUM('baixa','media','alta') NOT NULL DEFAULT 'media',
    status          ENUM('pendente','concluida') NOT NULL DEFAULT 'pendente',
    prazo           DATETIME,
    concluido_em    TIMESTAMP,
    criado_em       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_tarefa PRIMARY KEY (id_tarefa),
    CONSTRAINT fk_tarefa_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================
--  TABELA: grupo_membro  (N:M — usuario × grupo)
--  Registra a participação e o papel de cada membro no grupo.
-- ============================================================
CREATE TABLE grupo_membro (
    id_usuario  INT                     NOT NULL,
    id_grupo    INT                     NOT NULL,
    papel       ENUM('admin','membro')  NOT NULL DEFAULT 'membro',
    entrou_em   TIMESTAMP               NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_grupo_membro PRIMARY KEY (id_usuario, id_grupo),
    CONSTRAINT fk_gm_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_gm_grupo FOREIGN KEY (id_grupo)
        REFERENCES grupo (id_grupo)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================
--  TABELA: tarefa_grupo  (N:M — tarefa × grupo)
--  Registra o compartilhamento de tarefas com grupos.
-- ============================================================
CREATE TABLE tarefa_grupo (
    id_tarefa           INT         NOT NULL,
    id_grupo            INT         NOT NULL,
    compartilhado_em    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_tarefa_grupo PRIMARY KEY (id_tarefa, id_grupo),
    CONSTRAINT fk_tg_tarefa FOREIGN KEY (id_tarefa)
        REFERENCES tarefa (id_tarefa)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_tg_grupo FOREIGN KEY (id_grupo)
        REFERENCES grupo (id_grupo)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================
--  TABELA: notificacao
--  Armazena as notificações de prazo geradas pelo sistema.
-- ============================================================
CREATE TABLE notificacao (
    id_notificacao  INT                             NOT NULL AUTO_INCREMENT,
    id_tarefa       INT                             NOT NULL,
    id_usuario      INT                             NOT NULL,
    tipo            ENUM('24h','1h','vencida')      NOT NULL,
    mensagem        TEXT                            NOT NULL,
    enviado_em      TIMESTAMP                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lido            BOOLEAN                         NOT NULL DEFAULT FALSE,

    CONSTRAINT pk_notificacao PRIMARY KEY (id_notificacao),
    CONSTRAINT fk_notif_tarefa FOREIGN KEY (id_tarefa)
        REFERENCES tarefa (id_tarefa)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_notif_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ============================================================
--  ÍNDICES adicionais para performance
-- ============================================================
CREATE INDEX idx_tarefa_usuario    ON tarefa       (id_usuario);
CREATE INDEX idx_tarefa_status     ON tarefa       (status);
CREATE INDEX idx_tarefa_prazo      ON tarefa       (prazo);
CREATE INDEX idx_notif_usuario     ON notificacao  (id_usuario);
CREATE INDEX idx_notif_lido        ON notificacao  (lido);
CREATE INDEX idx_grupo_admin       ON grupo        (id_admin);

-- ============================================================
--  FIM DO SCRIPT
-- ============================================================
