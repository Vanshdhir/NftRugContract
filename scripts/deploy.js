const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with:', deployer.address);

  const pcTokenAddress = '0x8f6EEe1A9B705CE2024422a1E9759c2ef5dA7C3E';
  const zorTokenAddress = '0x90d729291763ee34C31E3F72F7FD939A5BBfBEf5';
  const baseURI = 'https://magenta-rear-mole-293.mypinata.cloud/ipfs/bafybeic3vonbbaqhzewto63ekp4kji7dyci4hcsu4uqzlshzldbxfnz4wq/';

  // Validate token addresses
  console.log('Validating token addresses');
  let pcToken, zorToken;
  try {
    pcToken = await hre.ethers.getContractAt('IERC20', pcTokenAddress);
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
  const rugDistributor = await RugDistributor.deploy(rugAddress, pcTokenAddress, zorTokenAddress);
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
      constructorArguments: [rugAddress, pcTokenAddress, zorTokenAddress],
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