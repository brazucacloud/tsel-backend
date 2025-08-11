# Usar nginx para servir arquivos estáticos
FROM nginx:alpine

# Copiar arquivos do frontend
COPY . /usr/share/nginx/html/

# Copiar configuração personalizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
