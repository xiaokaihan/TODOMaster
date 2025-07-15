module.exports = {
  // 使用ts-jest预设
  preset: 'ts-jest',
  
  // 测试环境
  testEnvironment: 'node',
  
  // 根目录
  rootDir: './src',
  
  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts'
  ],
  
  // 覆盖率收集配置
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/dist/**'
  ],
  
  // 覆盖率报告目录
  coverageDirectory: '../coverage',
  
  // 覆盖率报告格式
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  // 测试设置文件
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/setup/jest.setup.ts'
  ],
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // 测试超时时间
  testTimeout: 10000,
  
  // 详细输出
  verbose: true,
  
  // 强制退出
  forceExit: true,
  
  // 检测打开的句柄
  detectOpenHandles: true
}; 