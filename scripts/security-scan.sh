#!/bin/bash
# Docker 镜像安全扫描脚本
# 用法: ./security-scan.sh [image:tag]

set -e

IMAGE="${1:-aafa-backend:latest}"
REPORT_DIR="security-reports"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$REPORT_DIR"

echo "=========================================="
echo "🔒 Docker 镜像安全扫描"
echo "镜像: $IMAGE"
echo "=========================================="

# 检查 Trivy 是否安装
if ! command -v trivy &> /dev/null; then
    echo "安装 Trivy..."
    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
fi

# 运行安全扫描
echo "开始扫描..."
trivy image \
    --severity HIGH,CRITICAL \
    --format table \
    --output "$REPORT_DIR/trivy-$TIMESTAMP.txt" \
    "$IMAGE" || true

# JSON 格式报告
trivy image \
    --severity HIGH,CRITICAL \
    --format json \
    --output "$REPORT_DIR/trivy-$TIMESTAMP.json" \
    "$IMAGE" || true

# 显示结果
cat "$REPORT_DIR/trivy-$TIMESTAMP.txt"

echo ""
echo "=========================================="
echo "扫描报告已保存: $REPORT_DIR/trivy-$TIMESTAMP.txt"
echo "=========================================="
