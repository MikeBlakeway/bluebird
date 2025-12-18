/**
 * Test fixtures for E2E tests
 */

export const testLyrics = {
  simple: `Verse 1:
Walking down the street
Feeling the beat
Life is sweet

Chorus:
This is my song
Singing all day long
Can't go wrong`,

  full: `Verse 1:
In the morning light I rise
Dreams still dancing in my eyes
Coffee brewing, world awake
Another chance for me to take

Chorus:
Living life in full color
Every moment like no other
Paint the sky with hope and dreams
Nothing's ever as it seems

Verse 2:
Through the hustle and the noise
Finding beauty, making choice
Every step a new beginning
Keep on moving, keep on singing

Chorus:
Living life in full color
Every moment like no other
Paint the sky with hope and dreams
Nothing's ever as it seems

Bridge:
And when the night falls down
I'll wear it like a crown
Stars above will guide my way
To the dawn of a brand new day

Chorus:
Living life in full color
Every moment like no other
Paint the sky with hope and dreams
Nothing's ever as it seems`,

  short: `Verse:
Hello world
Here I am
Living free

Chorus:
This is me
This is now
This is how`,
}

export const testGenres = [
  'Pop',
  'Rock',
  'Jazz',
  'Hip-Hop',
  'Electronic',
  'Country',
  'R&B',
  'Indie',
] as const

export const testArtists = [
  'Luna Grace',
  'Max Harmony',
  'Nova Sky',
  'Echo Rivers',
  'Sage Melody',
] as const

export const testUsers = {
  standard: {
    email: 'test-standard@bluebird.test',
    tier: 'standard' as const,
  },
  pro: {
    email: 'test-pro@bluebird.test',
    tier: 'pro' as const,
  },
  admin: {
    email: 'test-admin@bluebird.test',
    tier: 'admin' as const,
  },
} as const

export const testProjects = {
  default: {
    name: 'Test Project',
    description: 'E2E test project',
  },
  withLyrics: {
    name: 'My First Song',
    description: 'Testing the preview flow',
  },
} as const
