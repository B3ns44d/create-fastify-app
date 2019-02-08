#! /usr/bin/env node

'use strict'

const fs = require('fs')
const log = require('../../lib/log')
const path = require('path')
const generify = require('generify')
const inquirer = require('inquirer')
const { execSync } = require('child_process')
const chalk = require('chalk')
const parseArgs = require('./args')
const stop = require('../../lib/utils').stop

function showHelp () {
  log('info', fs.readFileSync(path.join(__dirname, '..', '..', 'help', 'fastify.txt'), 'utf8'))
  return module.exports.stop()
}

async function generate (args, cb) {
  let opts = parseArgs(args)
  if (opts.help) {
    return showHelp()
  }

  if (opts._.length !== 1) {
    log('error', 'Missing required <project-name> parameter\n')
    return showHelp()
  }

  if (fs.existsSync(opts._[0])) {
    log('error', 'Project folder already exist\n')
    module.exports.stop()
  }

  const prompt = inquirer.createPromptModule()
  const answers = await prompt([
    { type: 'input', name: 'name', message: 'Application name', default: opts._[0] },
    { type: 'input', name: 'author', message: 'Author' },
    { type: 'input', name: 'email', message: 'Email' },
    { type: 'input', name: 'version', message: 'Version', default: '1.0.0' },
    { type: 'input', name: 'keywords', message: 'Keywords', default: 'fastify,nodejs' },
    { type: 'input', name: 'license', message: 'License', default: 'MIT' }
  ])

  generify(path.join(__dirname, 'templates', 'fastify-template-app'), opts._[0], {}, function (file) {
    log('debug', `generated ${file}`)
  }, function (err) {
    if (err) {
      return cb(err)
    }

    process.chdir(opts._[0])
    let pkg = fs.readFileSync('package.json','utf8')

    try {
      pkg = JSON.parse(pkg)
    } catch (err) {
      cb(err)
    }

    Object.assign(pkg, {
      name: answers.name,
      version: answers.version,
      author: `${answers.author} <${answers.email}>`,
      keywords: answers.keywords ? answers.keywords.split(',') : [],
      license: answers.license
    })

    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2))
    execSync('npm install', { stdio: 'inherit' })

    log('success', `${chalk.bold('package.json')} generated successfully with given information`)
    log('success', `project ${chalk.bold(pkg.name)} generated successfully`)
    log('success', `dependencies installed successfully`)
    log('success', `run 'cd ${chalk.bold(opts._[0])}' and '${chalk.bold('node server.js')}' to start the application`)
    cb()
  })
}

function cli(args) {
  generate(args, module.exports.stop)
}

module.exports = { cli, stop }

if (require.main === module) {
  cli(process.argv.slice(2))
}