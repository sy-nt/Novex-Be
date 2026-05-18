ARG VAULT_VERSION=1.18.1
FROM hashicorp/vault:${VAULT_VERSION}

# Set up vault user and directories
RUN mkdir -p /vault/data && \
mkdir -p /vault/logs && \
mkdir -p /vault/config && \
chown -R vault:vault /vault

COPY --chown=vault:vault vault.hcl /vault/config/vault.hcl

# Expose vault ports
EXPOSE 8200

# Set vault configuration directory
ENV VAULT_ADDR=http://127.0.0.1:8200

# Use vault user
USER vault

# Set entrypoint
ENTRYPOINT ["vault"]