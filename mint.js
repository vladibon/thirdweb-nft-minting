import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const { PRIVATE_KEY, THIRDWEB_SECRET_KEY, CONTRACT_ADDRESS, NFT_AMOUNT } = process.env;

async function main() {
  const wallet = new ethers.Wallet(
    PRIVATE_KEY,
    ethers.getDefaultProvider('https://ethereum.publicnode.com'),
  );

  const sdk = ThirdwebSDK.fromSigner(wallet, 'ethereum', { secretKey: THIRDWEB_SECRET_KEY });
  const contract = await sdk.getContract(CONTRACT_ADDRESS);

  const batch = [];

  for (let i = 1; i <= Number(NFT_AMOUNT); i++) {
    const filename = String(i).padStart(3, '0');
    const jsonData = JSON.parse(fs.readFileSync(`./metadata/${filename}.json`));

    jsonData.image = fs.readFileSync(`./images/${filename}.png`);

    batch.push(jsonData);
  }

  // Upload NFT metadata to IPFS (image can be a file or URL)
  const metadata = await contract.storage.uploadBatch(batch);

  // metadata[i] is an IPFS URI like: ipfs://Qm.../0
  console.log('Uploaded metadata to IPFS:', metadata);

  const tx = await contract.erc721.mintBatch(metadata);

  console.log('Minted NFTs:', tx);
}

main().catch(console.error);
