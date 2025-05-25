const { run } = require("hardhat");

const verify = async (contractAddress, args) => {
    console.log(`Verifying contract at ${contractAddress} with args: ${JSON.stringify(args)}`);
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
        console.log(`Successfully verified contract at ${contractAddress}`);
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log(`Contract at ${contractAddress} is already verified.`);
        } else {
            console.error(`Failed to verify contract at ${contractAddress}:`, e);
        }
    }
};

module.exports = { verify };