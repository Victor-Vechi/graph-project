FROM alpine:3.21

# Install curl, ca-certificates, and MinIO server binary
RUN apk add --no-cache curl ca-certificates && \
    (curl -sSfL -o /usr/local/bin/minio https://dl.min.io/community/server/minio/release/linux-amd64/minio 2>/dev/null || \
     (apk add --no-cache minio && cp /usr/bin/minio /usr/local/bin/minio)) && \
    chmod +x /usr/local/bin/minio && \
    mkdir -p /data

EXPOSE 9000 9001

VOLUME ["/data"]

ENTRYPOINT ["minio"]
CMD ["server", "/data", "--console-address", ":9001"]
