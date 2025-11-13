const express = require('express');
const path = require('path');
const app = express();

// Servir os arquivos estáticos do diretório dist
app.use(express.static(__dirname + '/dist/lubvel-front/browser'));

// Redirecionar todas as rotas para o index.html
app.get('/*', function(req,res) {
  res.sendFile(path.join(__dirname + '/dist/lubvel-front/browser/index.html'));
});

// Iniciar o servidor na porta correta
app.listen(process.env.PORT || 8080);
