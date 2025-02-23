const BASE_FIRESTORE = "https://firestore.googleapis.com/v1";

async function deleteFieldsInArticle({documentName, category, subCategory}) {
  try {
      const lastUpdated = new Date().toISOString();
      const fieldPaths = [ 'meta', 'meta.category', 'excerpt', 'coverHeight', 'date', 'coverImage', 'coverWidth', 'categories', 'updated', 'title'];
      const updateMask = fieldPaths.map(field => `updateMask.fieldPaths=${field}`).join('&');
      const firestorePath = `${BASE_FIRESTORE}/${documentName}?${updateMask}`;
      const method = "PATCH";
      
      const idToken =
      "eyJhbGciOiJSUzI1NiIsImtpZCI6IjhkMjUwZDIyYTkzODVmYzQ4NDJhYTU2YWJhZjUzZmU5NDcxNmVjNTQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYXV4aWxpdW0tNDIwOTA0IiwiYXVkIjoiYXV4aWxpdW0tNDIwOTA0IiwiYXV0aF90aW1lIjoxNzM5NzUzNDAwLCJ1c2VyX2lkIjoiRU84VldOUUR0QlpMWnF3N1p2eVBTSHBsdnJWMiIsInN1YiI6IkVPOFZXTlFEdEJaTFpxdzdadnlQU0hwbHZyVjIiLCJpYXQiOjE3Mzk3NTM0MDAsImV4cCI6MTczOTc1NzAwMCwiZW1haWwiOiJlcmljLmRlZ3V6bWFuQG91dGxvb2suY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiZXJpYy5kZWd1em1hbkBvdXRsb29rLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.eqghtZfU5u3lmHSh-nVKG4m6OHrJW4T9gZX8_oZwmTijzLRC10lKpRDXgd1IqcnN2jKOdkvX6hORgPBWkqVKC3pEtzQBWJxtBsejW4Z0wLlSABFToucvZlXpis7ii5tbZovpbHDWwZ_xNbgwqEv0bJs-8MV0Rf6ssMR_hmoE2b3QOZxqWRnaGMPC7GL3jBSI9dEeIJC-IAtgrcanlfXxkd7F6b_BbKtkW7OvJFx7z5GJHkQ6_aIr6vyfhQBHA3CDDBVd7_-xkyLfDHps44uzc3k04TaHqJaVzL1jsfWga0gstIJXyE3gNm0Bc8JO71MqSEUey1vIvZ_SLxSdfuZwQg";
      
      console.log(`firestorePath: ${firestorePath}`);
      const response = await fetch(firestorePath, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          "fields": {
            "meta": {
              "mapValue": {
                "fields": {
                  "category": {
                    "stringValue": category
                  },
                  "subCategory": {
                    "stringValue": subCategory
                  },
                  "lastUpdated": {
                    "timestampValue": lastUpdated
                  }
                }
              }
            }
          }
        })
      });
      console.log(`response.status: ${response.status}`);
      console.log(`response.statusText: ${response.statusText}`);
      console.log(`response.text: ${JSON.stringify(response.text(), null, 2)}`);
      
      return response.ok;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return false;
  }
  return true;
}

const documentName = "projects/auxilium-420904/databases/aux-db/documents/articles/8DCYGJ7NREzZe57H5ADb";
const category = "family-x";
const subCategory = "whole-child";
// deleteFieldsInArticle({ documentName, category, subCategory} );

import fs from 'fs';
import path from 'path';

const dataFolder = "/Users/edeguzma/personal-dev/aux-all/aux-ng/src/assets/data/";
const documentNames = [];

function readJsonFiles() {
    try {
        const files = fs.readdirSync(dataFolder);

        for (const file of files) {
            if (path.extname(file) === ".json") { // Ensure only JSON files are read
                const filePath = path.join(dataFolder, file);
                
                try {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const jsonData = JSON.parse(data);

                    if (jsonData.document?.name) {
                      const category = jsonData.document.fields.meta?.mapValue.fields.category.stringValue;
                      const subCategory = jsonData.document.fields.meta?.mapValue.fields.subCategory.stringValue;
                      const info = {
                        documentName:jsonData.document.name,
                        category,
                        subCategory
                      };
                      documentNames.push(info);
                      deleteFieldsInArticle(info);

                        console.log(`File: ${file}, Document Name: ${jsonData.document?.name}`);
                    } else {
                        console.warn(`File ${file} does not contain "document.name"`);
                    }
                } catch (error) {
                    console.error(`Error reading or parsing file ${file}:`, error);
                }
            }
        }
    } catch (error) {
        console.error("Error reading directory:", error);
    }
}

// Run the function
readJsonFiles();

console.log(JSON.stringify(documentNames, null, 2));