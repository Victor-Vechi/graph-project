FROM alpine:3.21

# Install curl, ca-certificates, and MinIO client (mc) binary
RUN apk add --no-cache curl ca-certificates && \
    (curl -sSfL -o /usr/local/bin/mc https://dl.min.io/client/mc/release/linux-amd64/mc 2>/dev/null || \
     (apk add --no-cache minio-client && cp /usr/bin/mcli /usr/local/bin/mc)) && \
    chmod +x /usr/local/bin/mc && \
    ln -sf /usr/local/bin/mc /usr/bin/mc

ENTRYPOINT ["mc"]
