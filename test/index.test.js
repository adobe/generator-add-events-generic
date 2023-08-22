/*
Copyright 2023 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

/* eslint jest/expect-expect: [
  "error",
  {
    "assertFunctionNames": [
        "expect",
        "assertManifestContent",
        "assertEnvContent",
        "assertEventCodeContent"
    ]
  }
]
*/

const helpers = require('yeoman-test')
const assert = require('yeoman-assert')
const fs = require('fs')
const { EOL } = require('os')
const yaml = require('js-yaml')
const path = require('path')
const cloneDeep = require('lodash.clonedeep')
const theGeneratorPath = require('../index')
const Generator = require('yeoman-generator')
const { constants } = require('@adobe/generator-app-common-lib')

/**
 * @param {string} actionName The provided runtime action name
 */
function assertGeneratedFiles (actionName) {
  assert.file(`${constants.actionsDirname}/${actionName}/index.js`)
  assert.file(`${constants.actionsDirname}/utils.js`)
  assert.file('ext.config.yaml')
  assert.file('.env')
  assert.file('package.json')
}

/* eslint no-unused-vars: 0 */
/**
 * @param {string} actionName The provided runtime action name
 * @param {string} pkgName Package name under which the action is installed
 */
function assertManifestContent (actionName, pkgName) {
  const json = yaml.load(fs.readFileSync('ext.config.yaml').toString())
  expect(json.runtimeManifest.packages).toBeDefined()

  // default packageName is path.basename(path.dirname('ext.config.yaml'))
  pkgName = pkgName || path.basename(process.cwd())

  expect(json.runtimeManifest.packages[pkgName].actions[actionName]).toEqual({
    function: `${constants.actionsDirname}/${actionName}/index.js`,
    web: 'no',
    runtime: constants.defaultRuntimeKind,
    inputs: {
      LOG_LEVEL: 'debug'
    },
    annotations: {
      final: true,
      'require-adobe-auth': false
    }
  })
  expect(Object.keys(json.events.registrations).length).toBe(1)
  expect(json.events.registrations['test-name']).toEqual({
    description: 'test-desc',
    events_of_interest: [
      {
        event_codes: [
          'event-metadata-1',
          'event-metadata-2'
        ],
        provider_metadata: 'provider-metadata-1'
      },
      {
        event_codes: [
          'event-metadata-3'
        ],
        provider_metadata: 'provider-metadata-2'
      }
    ],
    runtime_action: pkgName + '/test-action'
  })
}

// .env file contents
/**
 * @param {string} prevContent Previous content of the .env file
 * @param {string} newContent New content of the .env file
 */
function assertEnvContent (prevContent, newContent) {
  const finalContent = prevContent + newContent
  assert.fileContent('.env', finalContent.trim())
}

// action file contents
/**
 * @param {string} actionName The provided runtime action name
 */
function assertEventCodeContent (actionName) {
  const theFile = `${constants.actionsDirname}/${actionName}/index.js`
  // a few checks to make sure the action calls the events sdk to publish cloud events
  assert.fileContent(
    theFile,
    'const { Core } = require(\'@adobe/aio-sdk\')'
  )
  assert.fileContent(
    theFile,
    'const logger = Core.Logger(\'main\', { level: params.LOG_LEVEL || \'info\' })'
  )
  assert.fileContent(
    theFile,
    'logger.info(params)'
  )
}

beforeEach(() => {
  theGeneratorPath.prototype.promptForEventsDetails = jest.fn().mockResolvedValue({
    regName: 'test-name',
    regDesc: 'test-desc',
    selectedProvidersToEventMetadata: {
      'provider-metadata-1': {
        provider: {
          id: 'provider-id-1',
          label: 'provider-label-1',
          description: 'provider-desc-1',
          provider_metadata: 'provider-metadata-1',
          eventmetadata: [{
            name: 'event-metadata-1',
            value: 'event-metadata-1',
            description: 'event-metadata-desc-1'
          }, {
            name: 'event-metadata-2',
            value: 'event-metadata-2',
            description: 'event-metadata-desc-2'
          }]
        },
        eventmetadata: ['event-metadata-1', 'event-metadata-2']
      },
      'provider-metadata-2': {
        provider: {
          id: 'provider-id-2',
          label: 'provider-label-2',
          description: 'provider-desc-2',
          provider_metadata: 'provider-metadata-2',
          eventMetadata: [{
            name: 'event-metadata-3',
            value: 'event-metadata-3',
            description: 'event-metadata-desc-3'
          }]
        },
        eventmetadata: ['event-metadata-3']
      }
    },
    runtimeActionName: 'test-action'
  }
  )
})

describe('prototype', () => {
  test('exports a yeoman generator', () => {
    expect(theGeneratorPath.prototype).toBeInstanceOf(Generator)
  })
})

describe('run', () => {
  test('events template', async () => {
    const options = cloneDeep(global.basicGeneratorOptions)
    const prevDotEnvContent = `PREVIOUSCONTENT${EOL}`
    try {
      await helpers.run(theGeneratorPath)
        .withOptions(options)
        .inTmpDir(dir => {
          fs.writeFileSync(path.join(dir, '.env'), prevDotEnvContent)
        })
    } catch (e) {
      console.error(e)
    }

    const actionName = 'test-action'

    assertGeneratedFiles(actionName)
    assertEventCodeContent(actionName)
    assertManifestContent(actionName)
    assertNodeEngines(fs, constants.nodeEngines)
    assertDependencies(fs, { '@adobe/aio-sdk': expect.any(String) }, { '@openwhisk/wskdebug': expect.any(String) })
    const newEnvContent = `## Provider metadata to provider id mapping${EOL}AIO_events_providermetadata_to_provider_mapping=provider-metadata-1:provider-id-1,provider-metadata-2:provider-id-2`
    assertEnvContent(prevDotEnvContent, newEnvContent)
  })

  test('template with registration name already exists', async () => {
    const options = cloneDeep(global.basicGeneratorOptions)
    const prevDotEnvContent = `PREVIOUSCONTENT${EOL}## Provider metadata to provider id mapping${EOL}AIO_events_providermetadata_to_provider_mapping=provider-metadata-1:provider-id-1`
    await helpers.run(theGeneratorPath)
      .withOptions(options)
      .inTmpDir(dir => {
        fs.writeFileSync('ext.config.yaml', yaml.dump({
          runtimeManifest: {
            packages: {
              somepackage: {
                actions: {
                  'fake-action': { function: 'fake.js' }
                }
              }
            }
          },
          events: {
            registrations: {
              'test-name': {
                description: 'test-desc',
                events_of_interest: [
                  {
                    event_codes: [
                      'event-metadata-1',
                      'event-metadata-2'
                    ],
                    provider_metadata: 'provider-metadata-1'
                  }
                ],
                runtime_action: 'somepackage/fake-action'
              }
            }
          }
        }))
        fs.writeFileSync(path.join(dir, '.env'), prevDotEnvContent)
      })

    const actionName = 'test-action'
    assertGeneratedFiles(actionName)
    assertManifestContent(actionName, 'somepackage')
    const newEnvContent = ',provider-metadata-2:provider-id-2'
    assertEnvContent(prevDotEnvContent, newEnvContent)
    assertNodeEngines(fs, constants.nodeEngines)
    assertDependencies(fs, { '@adobe/aio-sdk': expect.any(String) }, { '@openwhisk/wskdebug': expect.any(String) })
  })

  test('template with --skip-prompt true', async () => {
    theGeneratorPath.prototype.promptForEventsDetails = jest.fn().mockResolvedValue(undefined)
    const options = cloneDeep(global.basicGeneratorOptions)
    options['skip-prompt'] = true
    const prevDotEnvContent = `PREVIOUSCONTENT${EOL}`
    await helpers.run(theGeneratorPath)
      .withOptions(options)
      .inTmpDir(dir => {
        fs.writeFileSync(path.join(dir, '.env'), prevDotEnvContent)
      })

    const actionName = 'test-action'
    assert.noFile(`${constants.actionsDirname}/${actionName}/index.js`)
    assert.noFile(`${constants.actionsDirname}/utils.js`)
    assert.noFile('ext.config.yaml')
    assert.file('.env')
    assert.noFile('package.json')
    assertEnvContent(prevDotEnvContent, '')
  })
})
