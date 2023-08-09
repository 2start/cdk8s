const { javascript } = require('projen');
const { Cdk8sTeamNodeProject } = require('@cdk8s/projen-common');
const { JobPermission } = require('projen/lib/github/workflows-model');

const mainBranch = 'master';

const project = new Cdk8sTeamNodeProject({
  name: 'root',
  repoName: 'cdk8s',
  defaultReleaseBranch: mainBranch,
  pullRequestTemplate: false,
  projenUpgradeSecret: 'PROJEN_GITHUB_TOKEN',
  release: false,
  devDeps: [
    '@cdk8s/projen-common',
    '@types/jest',
    '@types/node',
    'cdk8s',
    'cdk8s-cli',
    'cdk8s-plus-25',
    'cdk8s-plus-26',
    'cdk8s-plus-27',
    'constructs',
    'lerna',
    'semver',
    'ts-jest',
    'typescript',
    'projen',
  ],
});

project.gitignore.exclude('.vscode/');
project.gitignore.addPatterns('*.js');
project.gitignore.addPatterns('*.d.ts');
project.gitignore.addPatterns('dist/');

// enable mono-repo
project.package.addField('private', true);
project.package.addField('workspaces', {
  packages: []
});

// override the default test task to run test across the repo
project.testTask.reset('lerna run test -- -u');
project.tasks.removeTask('test:watch');
project.tasks.removeTask('test:update');
project.tasks.removeTask('test:compile');

// no package task is needed
project.packageTask.reset();

project.package.addPackageResolutions(
  // Pin version of @types/responselike and got, see: https://github.com/sindresorhus/got/issues/2129
  "@types/responselike@1.0.0",
  "got@12.3.1"
);

// updating new kubernetes spec
const generateSpecTask = project.addTask('generate-spec', {
  description: 'Generates the new k8s spec in the cdk8s/kubernetes-schemas/ directory',
  exec: 'tools/import-spec.sh',
  receiveArgs: true,
  args: [],
});

// generateSpecTask.exec();

// const fakeTask = project.addTask('hello', {
//   description: 'say hello',
//   // category: javascript.tasks.TaskCategory.TEST,
//   exec: 'echo hello, world!'
// });

// fakeTask.exec('echo helllooo');

// const generateSpecWorkflow = project.github.addWorkflow('generateNewK8sSpec');

// generateSpecWorkflow.addJob('create-pr', {
//   name: 'yuh',
//   steps: {

//   }
// });

// generateK8sSpecTask.addJob('backport', {
//   runsOn: ['ubuntu-latest'],
//   permissions: {
//     contents: github.workflows.JobPermission.WRITE,
//   },
//   steps: [
//     // needed in order to run the projen task as well
//     // as use the backport configuration in the repo.
//     {
//       name: 'checkout',
//       uses: 'actions/checkout@v3',
//       with: {
//         // required because we need the full history
//         // for proper backports.
//         'fetch-depth': 0,
//       },
//     },
//     {
//       name: 'Set Git Identity',
//       run: 'git config --global user.name "github-actions" && git config --global user.email "github-actions@github.com"',
//     },
//     {
//       name: 'backport',
//       if: 'github.event.pull_request.merged == true',
//       run: `npx projen ${backportTask.name}`,
//       env: {
//         GITHUB_TOKEN: '${{ secrets.PROJEN_GITHUB_TOKEN }}',
//         BACKPORT_PR_NUMBER: '${{ github.event.pull_request.number }}',
//       },
//     },
//   ],
// });


// integ tests
const integTask = project.addTask('integ', {
  exec: 'bash test/test-all.sh',
});
const integUpdate = project.addTask('integ:update', {
  exec: 'bash test/test-all.sh',
  env: { UPDATE_SNAPSHOTS: '1' }
});

// construct the build task
project.compileTask.exec('lerna run build');

// deploy website
const workflow = project.github.addWorkflow('website');
workflow.on({ push: { branches: [mainBranch] } });
workflow.addJobs({
  deploy: {
    permissions: {
      contents: JobPermission.WRITE,
    },
    runsOn: 'ubuntu-latest',
    steps: [
      {
        name: 'Checkout sources',
        uses: 'actions/checkout@v2'
      },
      {
        name: 'Setup Node.js',
        uses: 'actions/setup-node@v2',
      },
      {
        name: 'Setup Hugo',
        uses: 'peaceiris/actions-hugo@v2',
        with: {
          'hugo-version': '0.68.3',
          'extended': true,
        },
      },
      {
        name: 'Setup Python',
        uses: 'actions/setup-python@v2',
        with: {
          'python-version': '3.x',
          'architecture': 'x64',
        },
      },
      {
        name: 'Install dependencies',
        run: 'yarn install --frozen-lockfile',
      },
      {
        name: 'Build Website',
        run: [
          'cd website',
          './build.sh'
        ].join('\n')
      },
      {
        name: 'Build Docs Site',
        run: './docs/build.sh website/public/docs'
      },
      {
        name: 'Deploy',
        uses: 'peaceiris/actions-gh-pages@v3',
        with: {
          github_token: '${{ secrets.GITHUB_TOKEN }}',
          publish_dir: './website/public'
        }
      }
    ]
  }
});

// The API reference is generated when the website is built and released
// on the main branch, so the files should not be committed to the repo.
// See docs/build.sh.
const packages = [
  'cdk8s',
  'cdk8s-plus-25',
  'cdk8s-plus-26',
  'cdk8s-plus-27',
];
for (const pkg of packages) {
  for (const language of ['java', 'typescript', 'python']) {
    project.gitignore.exclude(`/docs/reference/${pkg}/${language}.md`);
  }
}


project.synth();