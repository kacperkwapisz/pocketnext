FROM alpine:latest

ARG PB_VERSION=0.25.8

RUN apk add --no-cache \
    unzip \
    ca-certificates \
    curl

# Download and unzip PocketBase
RUN mkdir -p /pb/pb_data /pb/pb_public && \
    curl -sSL https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip -o /tmp/pb.zip && \
    unzip /tmp/pb.zip -d /pb && \
    rm /tmp/pb.zip && \
    chmod +x /pb/pocketbase

WORKDIR /pb

# Copy migrations and hooks if they exist
COPY pb_migrations pb_migrations
COPY pb_hooks pb_hooks

EXPOSE 8090

# Run the server
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
