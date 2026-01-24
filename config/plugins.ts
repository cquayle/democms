export default () => ({
    graphql: {
        config: {
          endpoint: '/graphql',
          shadowCRUD: true,
          landingPage: true,
          depthLimit: 3,
          amountLimit: 100,
          apolloServer: {
            tracing: true,
            introspection: true
          },
        },
      },
});
