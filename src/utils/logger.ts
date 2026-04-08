import winston from 'winston';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const logDir = process.env.LOG_DIR || 'logs';

/**
 * 自定义日志格式
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

/**
 * 创建 Winston Logger 实例
 */
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  defaultMeta: {
    service: 'aafa-backend',
  },
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 综合日志
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // 未捕获的异常处理
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: fileFormat,
    }),
  ],
  // Promise 拒绝处理
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: fileFormat,
    }),
  ],
});

/**
 * 非生产环境添加控制台输出
 */
if (!isProduction) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

/**
 * HTTP 请求日志中间件
 */
export const httpLogger = winston.createLogger({
  level: 'http',
  format: fileFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

/**
 * 审计日志（用户操作记录）
 */
export const auditLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'audit.log'),
      maxsize: 5242880,
      maxFiles: 10,
    }),
  ],
});

/**
 * 性能日志
 */
export const perfLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'performance.log'),
      maxsize: 5242880,
      maxFiles: 3,
    }),
  ],
});

export default logger;

/**
 * 记录用户操作审计日志
 */
export function logAudit(
  action: string,
  userId: string,
  details: Record<string, unknown>
): void {
  auditLogger.info(action, {
    userId,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

/**
 * 记录性能指标
 */
export function logPerformance(
  operation: string,
  durationMs: number,
  metadata?: Record<string, unknown>
): void {
  perfLogger.info(operation, {
    duration: durationMs,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}
