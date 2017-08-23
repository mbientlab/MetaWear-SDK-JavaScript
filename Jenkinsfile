node {
  try {
    stage('checkout') {
      checkout scm : [extensions: [[$class: 'SubmoduleOption', recursiveSubmodules: true]]]
    }
    stage('prepare') {
      sh 'echo $PATH'
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