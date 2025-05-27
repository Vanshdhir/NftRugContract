const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with:', deployer.address);

  const zorTokenAddress = '0x07d1f327833299A5a22db588898860a6DaeC5aD6';
  const baseURI = 'https://bafybeia6ifzuf74phactxb3nloa6kd3vwor5q67xxs65u2bapkqpo3w5oi.ipfs.w3s.link/';

  // Validate token address
  console.log('Validating zor token address');
  let zorToken;
  try {
    zorToken = await hre.ethers.getContractAt('IERC20', zorTokenAddress);

  } catch (e) {
    throw new Error(`Invalid token addresses: ${e.message}`);
  }


  console.log('Deploying Rug');
  const Rug = await hre.ethers.getContractFactory('Rug');
  const rug = await Rug.deploy(baseURI);
  await rug.waitForDeployment();
  const rugAddress = await rug.getAddress();
  console.log('Rug deployed to:', rugAddress);

 
  console.log('Deploying RugDistributor');
  const RugDistributor = await hre.ethers.getContractFactory('RugDistributor');
  const rugDistributor = await RugDistributor.deploy(rugAddress, zorTokenAddress);
  await rugDistributor.waitForDeployment();
  const rugDistributorAddress = await rugDistributor.getAddress();
  console.log('RugDistributor deployed to:', rugDistributorAddress);


  console.log('Deploying RugAirdrop');
  const RugAirdrop = await hre.ethers.getContractFactory('RugAirdrop');
  const rugAirdrop = await RugAirdrop.deploy(rugAddress);
  await rugAirdrop.waitForDeployment();
  const rugAirdropAddress = await rugAirdrop.getAddress();
  console.log('RugAirdrop deployed to:', rugAirdropAddress);


  console.log('Adding moderators');
  try {
    let tx = await rug.addModerator(rugDistributorAddress);
    await tx.wait();
    console.log('RugDistributor added as moderator');
    tx = await rug.addModerator(rugAirdropAddress);
    await tx.wait();
    console.log('RugAirdrop added as moderator');

   
    const isDistributorModerator = await rug.moderators(rugDistributorAddress);
    const isAirdropModerator = await rug.moderators(rugAirdropAddress);
    console.log('RugDistributor Mod:', isDistributorModerator);
    console.log('RugAirdrop Mod:', isAirdropModerator);

    if (!isDistributorModerator) {
      tx = await rug.addModerator(rugDistributorAddress);
      await tx.wait();
      console.log('RugDistributor re-added as moderator');
    }
    if (!isAirdropModerator) {
      tx = await rug.addModerator(rugAirdropAddress);
      await tx.wait();
      console.log('RugAirdrop re-added as moderator');
    }
  } catch (e) {
    throw new Error(`Failed to add moderators: ${e.message}`);
  }


  console.log('Verifying RugDistributor state');
  const isPaused = await rugDistributor.mintingPaused();
  const isMaintaining = await rugDistributor.isMaintaining();
  const nftContractAddr = await rugDistributor.nftContract();
  console.log('Minting paused?', isPaused);
  console.log('Under maintenance?', isMaintaining);
  console.log('nftContract address:', nftContractAddr);
  if (isPaused) {
    tx = await rugDistributor.togglePause();
    await tx.wait();
    console.log('Unpaused RugDistributor');
  }
  if (isMaintaining) {
    tx = await rugDistributor.updateMaintaining(false);
    await tx.wait();
    console.log('Disabled maintenance');
  }
  if (nftContractAddr.toLowerCase() !== rugAddress.toLowerCase()) {
    throw new Error('nftContract address mismatch');
  }

 
  console.log('Verifying contracts');
  try {
    await hre.run('verify:verify', {
      address: rugAddress,
      constructorArguments: [baseURI],
    });
    await hre.run('verify:verify', {
      address: rugDistributorAddress,
      constructorArguments: [rugAddress, zorTokenAddress],
    });
    await hre.run('verify:verify', {
      address: rugAirdropAddress,
      constructorArguments: [rugAddress],
    });
  } catch (e) {
    console.warn('Contract verification fail', e.message);
  }

  console.log('Deployment completed');
}

main().catch((error) => {
  console.error('Deployment failed', error);
  process.exitCode = 1;
});