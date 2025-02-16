const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const targetPath = './src/environments/environment.ts';  // Modify this if you want to use it for prod
const envConfigFile = `
export const environment = {
  production: false,
  firebaseApiKey: '${process.env.FIREBASE_API_KEY || ''}'
};
`;

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log(`Environment file generated at ${targetPath}`);
  }
});