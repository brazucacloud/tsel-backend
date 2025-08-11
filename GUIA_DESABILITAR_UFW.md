# 🔧 Guia: Desabilitar UFW no Ubuntu 24.04 com Docker Compose

## ⚠️ ATENÇÃO
Este guia mostra como desabilitar o firewall UFW. Use apenas em ambientes controlados e de desenvolvimento.

## 🚀 Métodos Rápidos

### Método 1: Script Automático (Recomendado)
```bash
# Baixar e executar o script
wget https://raw.githubusercontent.com/brazucacloud/tsel-backend/master/disable-ufw-ubuntu.sh
chmod +x disable-ufw-ubuntu.sh
sudo ./disable-ufw-ubuntu.sh
```

### Método 2: Comandos Manuais
```bash
# Verificar status atual
sudo ufw status

# Desabilitar UFW
sudo ufw --force disable

# Verificar se foi desabilitado
sudo ufw status
```

### Método 3: Durante Instalação do Frontend
```bash
# O script de instalação agora pergunta sobre o UFW
sudo ./install-frontend-ubuntu-vps.sh
# Escolha opção 1 para desabilitar UFW
```

## 🔍 Verificações

### Status do UFW
```bash
sudo ufw status
# Deve mostrar: Status: inactive
```

### Testar Docker Compose
```bash
# Verificar se Docker está funcionando
docker ps

# Testar Docker Compose
docker-compose up -d
```

## 🔧 Reabilitar UFW (se necessário)

### Reabilitar com regras básicas
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
```

### Verificar regras
```bash
sudo ufw status numbered
```

## 🎯 Problemas Comuns

### Docker não consegue conectar
```bash
# Verificar se UFW está bloqueando
sudo ufw status

# Se estiver ativo, desabilitar
sudo ufw --force disable
```

### Portas bloqueadas
```bash
# Verificar portas em uso
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Se UFW estiver ativo, permitir portas
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
```

## 📋 Checklist

- [ ] UFW desabilitado: `sudo ufw status` mostra "inactive"
- [ ] Docker funcionando: `docker ps` executa sem erro
- [ ] Docker Compose funcionando: `docker-compose up -d` executa
- [ ] Frontend acessível: `http://SEU_IP:3000`
- [ ] Backend acessível: `http://SEU_IP:3001`

## 🚨 Segurança

### Para Produção
Se você desabilitou o UFW para desenvolvimento, considere:

1. **Reabilitar com regras específicas:**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 10.0.0.0/8  # Rede Docker
sudo ufw allow from 172.16.0.0/12  # Rede Docker
sudo ufw allow from 192.168.0.0/16  # Rede Docker
```

2. **Usar apenas em redes confiáveis**
3. **Configurar firewall no provedor de VPS**

## 📞 Suporte

Se tiver problemas:
1. Verifique o status: `sudo ufw status`
2. Verifique logs: `sudo journalctl -u ufw`
3. Reinicie UFW: `sudo systemctl restart ufw`

---

**💡 Dica:** Para desenvolvimento local, desabilitar o UFW é seguro e evita muitos problemas com Docker Compose.
