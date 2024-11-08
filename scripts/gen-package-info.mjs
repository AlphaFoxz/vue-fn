import fs from 'node:fs'
import path from 'node:path'
import { readPackageSync } from 'read-pkg'

const rootDir = process.cwd()
// 定义要生成 package.json 的模块
const modules = fs.readdirSync(path.join(rootDir, 'dist'))

// 遍历每个模块并生成 package.json
modules.forEach((module) => {
  const moduleDir = path.join(rootDir, 'dist', module)
  if (!fs.existsSync(moduleDir) || !fs.statSync(moduleDir).isDirectory()) {
    return
  }
  const packageJsonPath = path.join(moduleDir, 'package.json')

  const packageJsonContent = {
    main: './index.mjs',
    module: './index.mjs',
    types: './index.d.ts',
  }

  // 写入 package.json 文件
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2), 'utf8')
})

console.log('Package.json files generated for each module.')

const packageJsons = readPackageSync()
const publishPackageInfo = {
  ...packageJsons,
  sideEffects: false,
  private: false,
}
delete publishPackageInfo.scripts
delete publishPackageInfo.readme
delete publishPackageInfo.files
delete publishPackageInfo.devDependencies
delete publishPackageInfo._id

fs.writeFileSync(path.join(rootDir, 'dist', 'package.json'), JSON.stringify(publishPackageInfo, null, 2), 'utf8')

console.log('Package.json files generated for publish package.')
