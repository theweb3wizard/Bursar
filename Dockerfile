FROM node:24-slim
WORKDIR /app
COPY sdk/package.json sdk/package-lock.json* ./sdk/
RUN cd sdk && npm install --no-audit --no-fund --omit=dev
COPY sdk ./sdk
COPY dashboard ./dashboard
WORKDIR /app/sdk
ENV PORT=7860
EXPOSE 7860
CMD ["node", "server.js"]
