export const config = {
  folderReplacements: {
    reduxToolkit: 'store_types/redux_toolkit',
    reduxSaga: 'store_types/redux_saga',
    reduxQuery: 'store_types/redux_query',
    mobix: 'store_types/mobix',
  },
  nestedInViewFolder: ['hooks'],
  pathReplacements: {
    reduxToolkit: {},
    reduxSaga: {
      '../../modules': '~/modules',
      '../modules': '~/modules',
      '../../store': '~/store',
      './store': '~/store',
      '~/store_types/redux_saga/store': '~/store',
    },
    reduxQuery: {
      '../../features': '~/features',
      '../features': '~/features',
      '../../services': '~/services',
      '../services': '~/services',
      '../../app': '~/app',
      '../app': '~/app',
      './app': '~/app',
      '../../../../app.json': '../../app.json',
    },
    mobix: {},
  },
  template: {
    js: '@vahesaroyan/react-native-boilerplate', // '@vahesaroyan/react-native-boilerplate',
    ts: '@vahesaroyan/rnb-plugin-typescript', // '@vahesaroyan/react-native-boilerplate-typescript'
  },
};
