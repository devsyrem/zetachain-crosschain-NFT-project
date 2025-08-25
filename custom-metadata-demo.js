// Universal NFT Custom Metadata Demonstration
const { PublicKey, Keypair } = require('@solana/web3.js');

console.log('🎨 CUSTOM METADATA CAPABILITIES DEMONSTRATION');
console.log('=============================================\n');

// Example 1: Art NFT with Rich Metadata
const artNFT = {
    name: "Digital Masterpiece #001",
    symbol: "ARTM",
    description: "A unique digital artwork showcasing cross-chain capabilities",
    image: "https://ipfs.io/ipfs/QmYourArtworkHash",
    external_url: "https://your-gallery.com/artwork/001",
    animation_url: "https://ipfs.io/ipfs/QmAnimationHash.mp4",
    attributes: [
        { trait_type: "Artist", value: "Digital Creator" },
        { trait_type: "Medium", value: "Digital Oil Painting" },
        { trait_type: "Year", value: "2025" },
        { trait_type: "Rarity", value: "Legendary" },
        { trait_type: "Chain Origin", value: "Solana" },
        { trait_type: "Cross-Chain", value: "Enabled" },
        { trait_type: "Edition", value: "1 of 1" }
    ],
    properties: {
        category: "art",
        creators: [
            {
                address: "ArtistWallet1234567890123456789012345678",
                verified: true,
                share: 95
            },
            {
                address: "PlatformWallet9876543210987654321098765",
                verified: true,
                share: 5
            }
        ]
    }
};

// Example 2: Gaming NFT with Stats
const gamingNFT = {
    name: "Legendary Sword of ZetaChain",
    symbol: "LSZC",
    description: "A powerful weapon that can travel across blockchain realms",
    image: "https://game-assets.com/weapons/legendary-sword.png",
    attributes: [
        { trait_type: "Weapon Type", value: "Sword" },
        { trait_type: "Rarity", value: "Legendary" },
        { trait_type: "Attack Power", value: "850" },
        { trait_type: "Defense", value: "200" },
        { trait_type: "Speed", value: "75" },
        { trait_type: "Element", value: "Lightning" },
        { trait_type: "Level", value: "50" },
        { trait_type: "Durability", value: "98%" },
        { trait_type: "Cross-Chain Compatible", value: "Yes" },
        { trait_type: "Blockchain", value: "Multi-Chain" }
    ],
    properties: {
        category: "gaming",
        game: "ZetaChain Warriors",
        itemType: "weapon",
        transferable: true,
        upgradeable: true
    }
};

// Example 3: Real Estate NFT
const realEstateNFT = {
    name: "Virtual Land Plot #7734",
    symbol: "VLAND",
    description: "Prime virtual real estate in the metaverse",
    image: "https://metaverse-assets.com/land/7734-aerial.jpg",
    attributes: [
        { trait_type: "Location", value: "Central District" },
        { trait_type: "Size", value: "1000x1000 meters" },
        { trait_type: "Zone", value: "Commercial" },
        { trait_type: "Elevation", value: "Sea Level" },
        { trait_type: "Water Access", value: "Yes" },
        { trait_type: "Road Access", value: "Highway Adjacent" },
        { trait_type: "Development Status", value: "Buildable" },
        { trait_type: "Owner Benefits", value: "Governance Voting" }
    ],
    properties: {
        category: "real_estate",
        coordinates: { x: 1250, y: 750 },
        buildingRights: true,
        rentalIncome: "5% APY",
        governanceWeight: 100
    }
};

// Example 4: Music NFT
const musicNFT = {
    name: "Eternal Harmony",
    symbol: "MUSIC",
    description: "An exclusive musical composition with cross-chain licensing",
    image: "https://music-covers.com/eternal-harmony.jpg",
    animation_url: "https://ipfs.io/ipfs/QmMusicTrackHash.mp3",
    attributes: [
        { trait_type: "Artist", value: "Blockchain Beats" },
        { trait_type: "Genre", value: "Electronic" },
        { trait_type: "Duration", value: "3:42" },
        { trait_type: "BPM", value: "128" },
        { trait_type: "Key", value: "C Major" },
        { trait_type: "Release Year", value: "2025" },
        { trait_type: "License Type", value: "Commercial" },
        { trait_type: "Royalty Share", value: "10%" }
    ],
    properties: {
        category: "music",
        fileFormat: "320kbps MP3",
        licensing: "commercial_use",
        royaltyPayouts: true,
        stemFiles: ["bass.wav", "drums.wav", "synth.wav"]
    }
};

// Example 5: Collectible Card
const collectibleCard = {
    name: "ZetaChain Genesis Card #001",
    symbol: "ZGEN",
    description: "First edition collectible card celebrating ZetaChain launch",
    image: "https://cards.zetachain.com/genesis/001.png",
    attributes: [
        { trait_type: "Edition", value: "Genesis" },
        { trait_type: "Card Number", value: "001" },
        { trait_type: "Rarity", value: "Mythic" },
        { trait_type: "Power Level", value: "9000" },
        { trait_type: "Element", value: "Omni-Chain" },
        { trait_type: "Artist", value: "Crypto Artist X" },
        { trait_type: "Holographic", value: "Yes" },
        { trait_type: "Print Run", value: "100" }
    ],
    properties: {
        category: "collectible",
        cardGame: "ZetaChain TCG",
        tournament_legal: true,
        foil_treatment: "rainbow_holographic"
    }
};

// Display all examples
const nftExamples = [
    { type: "Digital Art", nft: artNFT },
    { type: "Gaming Item", nft: gamingNFT },
    { type: "Virtual Real Estate", nft: realEstateNFT },
    { type: "Music Track", nft: musicNFT },
    { type: "Collectible Card", nft: collectibleCard }
];

nftExamples.forEach((example, index) => {
    console.log(`${index + 1}. ${example.type.toUpperCase()}`);
    console.log('-'.repeat(example.type.length + 3));
    console.log(`Name: ${example.nft.name}`);
    console.log(`Symbol: ${example.nft.symbol}`);
    console.log(`Description: ${example.nft.description}`);
    console.log(`Attributes (${example.nft.attributes.length} total):`);
    
    example.nft.attributes.slice(0, 5).forEach(attr => {
        console.log(`  • ${attr.trait_type}: ${attr.value}`);
    });
    
    if (example.nft.attributes.length > 5) {
        console.log(`  ... and ${example.nft.attributes.length - 5} more attributes`);
    }
    
    if (example.nft.properties) {
        console.log(`Category: ${example.nft.properties.category}`);
    }
    
    console.log('');
});

console.log('🔧 METADATA CAPABILITIES SUMMARY');
console.log('=================================');
console.log('✅ Custom Names and Symbols');
console.log('✅ Rich Descriptions');
console.log('✅ Image and Animation URLs');
console.log('✅ Unlimited Custom Attributes');
console.log('✅ Trait-based Properties');
console.log('✅ Creator Information');
console.log('✅ Royalty Configuration');
console.log('✅ Category Classification');
console.log('✅ External URL Links');
console.log('✅ Cross-Chain Metadata Preservation');
console.log('✅ IPFS Integration Support');
console.log('✅ JSON Schema Compliance');

console.log('\n🌐 CROSS-CHAIN METADATA FEATURES');
console.log('=================================');
console.log('• Metadata preserved during cross-chain transfers');
console.log('• Compatible with OpenSea, Magic Eden, and other marketplaces');
console.log('• Supports Metaplex Token Metadata Standard');
console.log('• Custom attributes maintained across all chains');
console.log('• Creator royalties preserved cross-chain');
console.log('• IPFS links remain accessible on all networks');

module.exports = { nftExamples };