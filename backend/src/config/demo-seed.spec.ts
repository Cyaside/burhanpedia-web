import { assertLocalSeedDatabase } from '../../scripts/database/connection';

describe('demo seed target', () => {
  it.each([
    'postgresql://user:pass@localhost:5432/burhanpedia',
    'postgres://user:pass@127.0.0.1:5432/burhanpedia',
    'postgresql://user:pass@[::1]:5432/burhanpedia',
  ])('accepts a loopback database', (connectionString) => {
    expect(() => assertLocalSeedDatabase(connectionString)).not.toThrow();
  });

  it.each([
    'postgresql://user:pass@db.example.com:5432/burhanpedia',
    'postgresql://user:pass@192.168.1.10:5432/burhanpedia',
  ])('rejects a remote database', (connectionString) => {
    expect(() => assertLocalSeedDatabase(connectionString)).toThrow(
      'Development data may only be loaded into a local database',
    );
  });
});
