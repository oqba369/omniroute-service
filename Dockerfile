FROM diegosouzapw/omniroute:latest

ENV REQUIRE_API_KEY=false
ENV OMNIROUTE_OPEN_ACCESS=true
ENV OMNIROUTE_MEMORY_MB=512

COPY --chown=node:node configure-access.mjs start.mjs /app/
RUN node --check /app/configure-access.mjs && node --check /app/start.mjs

EXPOSE 10000
CMD ["node", "/app/start.mjs"]
