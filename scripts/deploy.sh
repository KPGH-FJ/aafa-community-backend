#!/bin/bash
#
# AAFA 后端生产环境部署脚本
# 用法: ./deploy.sh [environment]
# 环境: production (默认), staging
#

set -e

# ============================================
# 配置
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-production}"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
ENV_FILE="$PROJECT_DIR/.env"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# 日志函数
# ============================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# ============================================
# 检查前置条件
# ============================================
check_prerequisites() {
    log_info "检查前置条件..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    # 检查环境变量文件
    if [ ! -f "$ENV_FILE" ]; then
        log_error "环境变量文件不存在: $ENV_FILE"
        log_info "请复制 .env.example 为 .env 并配置"
        exit 1
    fi
    
    # 检查 docker-compose.yml
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "docker-compose.yml 不存在"
        exit 1
    fi
    
    log_success "前置条件检查通过"
}

# ============================================
# 备份数据
# ============================================
backup_data() {
    log_info "备份数据..."
    
    mkdir -p "$BACKUP_DIR"
    
    # 备份数据库
    if [ -d "$PROJECT_DIR/data" ]; then
        BACKUP_FILE="$BACKUP_DIR/db-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR" data/
        log_success "数据库备份完成: $BACKUP_FILE"
    fi
    
    # 备份上传文件
    if [ -d "$PROJECT_DIR/uploads" ]; then
        BACKUP_FILE="$BACKUP_DIR/uploads-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR" uploads/
        log_success "上传文件备份完成: $BACKUP_FILE"
    fi
    
    # 清理旧备份（保留最近 7 天）
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true
}

# ============================================
# 拉取最新镜像
# ============================================
pull_images() {
    log_info "拉取最新镜像..."
    
    cd "$PROJECT_DIR"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose pull
    else
        docker-compose -f "$COMPOSE_FILE" build --no-cache
    fi
    
    log_success "镜像拉取/构建完成"
}

# ============================================
# 启动服务
# ============================================
start_services() {
    log_info "启动服务..."
    
    cd "$PROJECT_DIR"
    
    # 停止旧服务
    log_info "停止旧服务..."
    docker-compose down --remove-orphans
    
    # 启动新服务
    log_info "启动新服务..."
    docker-compose up -d
    
    log_success "服务启动完成"
}

# ============================================
# 健康检查
# ============================================
health_check() {
    log_info "执行健康检查..."
    
    local retries=10
    local wait_time=5
    local url="http://localhost:3001/health"
    
    for i in $(seq 1 $retries); do
        log_info "健康检查尝试 $i/$retries..."
        
        if curl -sf "$url" > /dev/null 2>&1; then
            log_success "健康检查通过"
            return 0
        fi
        
        sleep $wait_time
    done
    
    log_error "健康检查失败"
    return 1
}

# ============================================
# 清理旧资源
# ============================================
cleanup() {
    log_info "清理旧资源..."
    
    # 清理未使用的镜像
    docker image prune -f
    
    # 清理未使用的卷
    docker volume prune -f
    
    # 清理构建缓存（可选）
    # docker builder prune -f
    
    log_success "清理完成"
}

# ============================================
# 显示状态
# ============================================
show_status() {
    log_info "当前服务状态:"
    docker-compose ps
    
    log_info "资源使用情况:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || true
}

# ============================================
# 回滚
# ============================================
rollback() {
    log_warn "执行回滚..."
    
    cd "$PROJECT_DIR"
    
    # 回滚到上一个版本
    docker-compose down
    
    # 如果有备份，恢复数据库
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/db-*.tar.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "恢复数据库备份: $LATEST_BACKUP"
        tar -xzf "$LATEST_BACKUP" -C "$PROJECT_DIR"
    fi
    
    # 使用上一个镜像启动
    # TODO: 需要实现镜像标签管理
    
    log_warn "回滚完成，请手动检查"
}

# ============================================
# 主函数
# ============================================
main() {
    log_info "========================================"
    log_info "开始部署: $ENVIRONMENT 环境"
    log_info "========================================"
    
    # 创建日志目录
    mkdir -p "$PROJECT_DIR/logs"
    
    # 执行部署步骤
    check_prerequisites
    backup_data
    pull_images
    start_services
    
    # 健康检查
    if health_check; then
        cleanup
        show_status
        log_success "========================================"
        log_success "部署成功完成!"
        log_success "========================================"
    else
        log_error "========================================"
        log_error "部署失败!"
        log_error "========================================"
        rollback
        exit 1
    fi
}

# 错误处理
trap 'log_error "脚本执行中断"; exit 1' INT TERM

# 运行主函数
main
