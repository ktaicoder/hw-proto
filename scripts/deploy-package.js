const shell = require('shelljs')
const fs = require('fs')

function increaseVersion() {
    const pkg = JSON.parse(fs.readFileSync('package.json'))
    let [major, minor, patch] = pkg.version.split('.')
    if (patch < 9999) {
        patch++
    } else if (minor < 99) {
        minor++
    } else {
        major++
    }

    pkg.version = `${major}.${minor}.${patch}`
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 4))
    return pkg.version
}

function version() {
    const now = new Date()
    const pad = (n) => (n < 10 ? '0' + n : n.toString())
    const ymd = [now.getFullYear(), now.getMonth() + 1, now.getDay()].map(pad).join('')
    const hms = [now.getHours(), now.getMinutes() + 1, now.getSeconds()].map(pad).join('')

    return ymd + '.' + hms
}

function exec(cmd) {
    shell.echo(cmd)
    shell.exec(cmd)
}

async function main() {
    shell.rm('-rf', 'tmp')
    shell.mkdir('tmp')
    shell.pushd('tmp')
    shell.exec('git clone -b next https://github.com/ktaicoder/hw-proto.git')
    shell.cd('hw-proto')
    exec('git rm -r cjs')
    shell.cp('-rf', '../../dist/*', '.')
    const version = increaseVersion()
    const releaseBranch = `release-v${version}`
    exec('git add cjs package*')
    exec(`git commit -m '${releaseBranch}'`)
    exec('git push')
    exec(`git checkout -b ${releaseBranch}`)
    exec(`git push origin ${releaseBranch}`)
    shell.popd()
    shell.echo('remove tmp directory')
    shell.rm('-rf', 'tmp')
}

main()
