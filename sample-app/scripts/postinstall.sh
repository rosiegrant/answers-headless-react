# This is needed to properly link the react bindings to the sample-app
# We also need to link the React dependency so there aren't two different versions of React

cd ..
npm link sample-app/node_modules/react
npm run build
cd sample-app
npm link ..