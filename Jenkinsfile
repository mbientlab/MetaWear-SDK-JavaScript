node {
  try {
    stage('checkout') {
      checkout scm
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