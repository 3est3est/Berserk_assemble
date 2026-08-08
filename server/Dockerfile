FROM rust:1.97-bookworm AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    clang cmake pkg-config libssl-dev libpq-dev && \
    rm -rf /var/lib/apt/lists/*
COPY server/Cargo.toml server/Cargo.lock ./
COPY server/src ./src
COPY server/statics ./statics
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libpq5 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/server /app/server
COPY server/statics /app/statics
EXPOSE 8000
CMD ["./server"]
