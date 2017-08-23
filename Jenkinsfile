#!/usr/bin/env groovy

node {
  try {
    stage('checkout') {
      checkout([
        $class: 'GitSCM',
        branches: [[name: '**']],
        doGenerateSubmoduleConfigurations: false,
        extensions: [[
          $class: 'SubmoduleOption', 
          disableSubmodules: false, 
          parentCredentials: false, 
          recursiveSubmodules: true, 
          reference: '', 
          trackingSubmodules: false
        ]],
        submoduleCfg: [],
        userRemoteConfigs: [[
          credentialsId: 'github',
          url: 'https://github.com/mbientlab/MetaWear-SDK-JavaScript'
        ]]
      ])
    }
    stage('prepare') {
      sh 'node -v'
      sh 'npm prune'
    }
    stage('compile') {
      sh 'npm install'
    }
    stage('test') {
      sh 'npm test'
    }
  } finally {
    stage('cleanup') {
      echo 'doing some cleanup...'
    }
  }
}