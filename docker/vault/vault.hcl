ui = true

# File storage backend
storage "file" {
  path = "/vault/data"
}

# HTTP listener
listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_disable   = 1
}

# API address
api_addr = "http://0.0.0.0:8200"
cluster_addr = "https://0.0.0.0:8201"
disable_mlock = true

# Log level
log_level = "info"