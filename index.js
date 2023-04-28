/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const { EventsGenerator, constants, commonTemplates } = require("@adobe/generator-app-common-lib")
const { commonDependencyVersions } = constants
const path = require('path')

class EventsStandardGenerator extends EventsGenerator {
  constructor (args, opts) {
    super(args, opts)
  }

  async prompting() {
    this.regDetails = await this.promptForEventsDetails({regName: 'Event Registration Default', regDesc:'Registration for IO Events'})
  }

  writing () {
    this.sourceRoot(path.join(__dirname, '.'))

    this.addEvents(this.regDetails, './templates/events-generic.js',{
      sharedLibFile: commonTemplates.utils,
      sharedLibTestFile: commonTemplates['utils.test'],
      dependencies: {
        '@adobe/aio-sdk': commonDependencyVersions['@adobe/aio-sdk'],
        'node-fetch': '^2.6.0'
      },
      actionManifestConfig: {
        web: 'no',
        inputs: { LOG_LEVEL: 'debug' },
        annotations: { 'require-adobe-auth': false, final: true } // makes sure loglevel cannot be overwritten by request param
      }
    })
  }
}

module.exports = EventsStandardGenerator
