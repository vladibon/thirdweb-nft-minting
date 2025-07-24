import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import jsonTemplate from './metadata/template.json' with { type: 'json' };
dotenv.config();

const { PRIVATE_KEY, THIRDWEB_SECRET_KEY, CONTRACT_ADDRESS } = process.env;

async function main() {
  const wallet = new ethers.Wallet(
    PRIVATE_KEY,
    ethers.getDefaultProvider('https://ethereum.publicnode.com'),
  );
  const sdk = ThirdwebSDK.fromSigner(wallet, 'ethereum', { secretKey: THIRDWEB_SECRET_KEY });
  const contract = await sdk.getContract(CONTRACT_ADDRESS);

  // Read images and prepare a batch of metadata
  const imgFiles = fs.readdirSync('./images');
  const batch = [];

  for (let i = 0; i < imgFiles.length; i++) {
    try {
      const filename = path.parse(imgFiles[i]).name;
      let jsonData = { ...jsonTemplate };

      try {
        // Read prepared JSON file if exists
        jsonData = JSON.parse(fs.readFileSync(`./metadata/${filename}.json`));
      } catch (err) {
        console.log(`JSON file with name: ${filename} doesn't exist, using template:`);
      }

      jsonData.image = fs.readFileSync(`./images/${filename}.png`);

      batch.push(jsonData);
    } catch (err) {
      console.error('Error reading file:', err);
      continue;
    }
  }

  console.log('Readed PNG images:', batch.length);

  // Upload NFT metadata to IPFS (image can be a file or URL)
  const metadata = await contract.storage.uploadBatch(batch);
  // metadata[i] is an IPFS URI like: ipfs://Qm.../0
  console.log('Uploaded metadata to IPFS:', metadata.length, metadata);

  // Mint NFTs
  // const tx = await contract.erc721.mintBatch(metadata);
  // console.log('Minted NFTs:', tx.length, tx);
}

main().catch(console.error);
