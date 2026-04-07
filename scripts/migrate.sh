#!/bin/bash
#
# 数据库迁移脚本
# 用法: ./migrate.sh [command]
# 命令: deploy (默认), status, reset, seed
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMMAND="${1:-deploy}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$PROJECT_DIR"

# 检查是否在容器内运行
if [ -f /.dockerenv ]; then
    PRISMA_CMD="npx prisma"
else
    PRISMA_CMD="docker-compose exec -T app npx prisma"
fi

case "$COMMAND" in
    deploy)
        echo -e "${GREEN}部署数据库迁移...${NC}"
        $PRISMA_CMD migrate deploy
        echo -e "${GREEN}迁移完成!${NC}"
        ;;
    
    status)
        echo -e "${YELLOW}检查迁移状态...${NC}"
        $PRISMA_CMD migrate status
        ;;
    
    reset)
        echo -e "${RED}⚠️  警告: 这将重置数据库!${NC}"
        read -p "确认继续? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            $PRISMA_CMD migrate reset --force
            echo -e "${GREEN}数据库已重置!${NC}"
        else
            echo "已取消"
        fi
        ;;
    
    seed)
        echo -e "${GREEN}执行数据填充...${NC}"
        if [ -f /.dockerenv ]; then
            npx ts-node prisma/seed.ts
        else
            docker-compose exec -T app npx ts-node prisma/seed.ts
        fi
        echo -e "${GREEN}数据填充完成!${NC}"
        ;;
    
    *)
        echo "用法: $0 [deploy|status|reset|seed]"
        exit 1
        ;;
esac
