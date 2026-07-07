import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCommentsTable1700000000003 implements MigrationInterface {
  name = 'CreateCommentsTable1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'content', type: 'text', isNullable: false },
          { name: 'taskId', type: 'uuid', isNullable: false },
          { name: 'authorId', type: 'uuid', isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['taskId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tasks',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('comments');
    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('comments', fk);
      }
    }
    await queryRunner.dropTable('comments');
  }
}
