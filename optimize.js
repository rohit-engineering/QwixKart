// optimize.js
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import prettyBytes from 'pretty-bytes'
import brotliSize from 'brotli-size'

const spinner = ora('Building and optimizing your Vue app...').start()

try {
  execSync('vite build', { stdio: 'inherit' })

  spinner.text = 'Analyzing and compressing build files...'

  const distDir = path.resolve('./dist')
  const files = fs.readdirSync(distDir)
  let total = 0

  for (const file of files) {
    const filePath = path.join(distDir, file)
    if (fs.statSync(filePath).isFile() && /\.(js|css|html)$/i.test(file)) {
      const content = fs.readFileSync(filePath)
      const size = brotliSize.sync(content)
      total += size
      console.log(
        chalk.cyan(`→ ${file}`),
        chalk.gray('→'),
        chalk.green(prettyBytes(size))
      )
    }
  }

  spinner.succeed('Build optimization complete!')
  console.log(chalk.bold(`📦 Total optimized (Brotli size): ${prettyBytes(total)}`))

  // Optionally remove source maps
  fs.rmSync(distDir + '/**/*.map', { recursive: true, force: true })
  console.log(chalk.gray('🧹 Source maps removed for cleaner production build.'))

} catch (error) {
  spinner.fail('❌ Optimization failed:')
  console.error(error)
}
