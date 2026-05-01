CREATE DATABASE suporte_bot;

USE suporte_bot;

CREATE TABLE chamados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(30),
  usuario VARCHAR(50),
  problema TEXT,
  status VARCHAR(20),
  data_abertura DATETIME
);