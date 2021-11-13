const shell = require('shelljs')


function exec(cmd) {
    shell.echo(cmd)
    shell.exec(cmd)
}

async function main() {
    shell.rm('-rf', 'dist')
    shell.mkdir('dist')
    shell.cp('-rf', './build/cjs', 'dist/')
    shell.cp('-rf', 'package-dist.json', 'dist/package.json')
    // const target = '/home/pi/blockcoding/kt_ai_makers_kit_block_coding_driver/blockDriver/node_modules/@aimk/hw-proto/'
    // exec(`scp -r dist/* pi@192.168.114.95:${target}`)
}

main()
