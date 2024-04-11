module.exports = {
  async up(db, client) {
   
    await db.createCollection('prompts');
    await db.collection('prompts').createIndexes([
      { v: 2, key: { _id: 1 }, name: '_id_' },
      { v: 2, key: { userId: 1 }, name: 'userId_1' },
      { v: 2, key: { 'prompt.folderId': 1 }, name: 'prompt.folderId_1' },
      { v: 2, key: { 'prompt.id': 1 }, name: 'prompt.id_1' }
    ]);

    await db.createCollection('publicPrompts');
    await db.collection('publicPrompts').createIndexes([
      { v: 2, key: { _id: 1 }, name: '_id_' },
      { v: 2, key: { 'prompt.folderId': 1 }, name: 'prompt.folderId_1' },
      { v: 2, key: { 'prompt.id': 1 }, name: 'prompt.id_1' }
    ]);

    await db.createCollection('conversations');
    await db.collection('conversations').createIndexes([
      { v: 2, key: { _id: 1 }, name: '_id_' },
      { v: 2, key: { userId: 1 }, name: 'userId_1' },
      { v: 2, key: { 'conversation.id': 1 }, name: 'conversation.id_1' }
    ]);

    await db.createCollection('publicFolders');
    await db.collection('publicFolders').createIndexes([
      { v: 2, key: { _id: 1 }, name: '_id_' },
      { v: 2, key: { 'folder.id': 1 }, name: 'folder.id_1' }
    ]);

    await db.createCollection('users');
    await db.collection('users').createIndexes([
      { v: 2, key: { _id: 1 }, name: '_id_' },
      { v: 2, key: { email: 1 }, name: 'email_1' }
    ]);

    await db.createCollection('llmConfig');
    await db.collection('llmConfig').createIndexes([
      { v: 2, key: { _id: 1 }, name: '_id_' }
    ]);

    await db.createCollection('folders');
    await db.collection('folders').createIndexes([
      { v: 2, key: { _id: 1 }, name: '_id_' },
      { v: 2, key: { 'folder.id': 1 }, name: 'folder.id_1' }
    ]);

    await db.createCollection('settings');
    await db.collection('settings').createIndexes([
      { v: 2, key: { _id: 1 }, name: '_id_' },
      { v: 2, key: { userId: 1 }, name: 'userId_1' }
    ]);

    await db.createCollection('userLlmUsage');
    await db.collection('userLlmUsage').createIndexes([
      { v: 2, key: { _id: 1 }, name: '_id_' },
      { v: 2, key: { userId: 1 }, name: 'userId_1' },
      { v: 2, key: { date: 1 }, name: 'date_1' }
    ]);

  },

  async down(db, client) {

    await db.dropCollection('prompts');
    await db.dropCollection('publicPrompts');
    await db.dropCollection('conversations');
    await db.dropCollection('publicFolders');
    await db.dropCollection('users');
    await db.dropCollection('llmConfig');
    await db.dropCollection('folders');
    await db.dropCollection('settings');
    await db.dropCollection('userLlmUsage');
    
  }
};
