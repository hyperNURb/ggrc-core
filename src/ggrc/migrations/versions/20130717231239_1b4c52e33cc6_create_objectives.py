# Copyright (C) 2013 Google Inc., authors, and contributors <see AUTHORS file>
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
# Created By: dan@reciprocitylabs.com
# Maintained By: dan@reciprocitylabs.com

"""Create Objectives and friends

Revision ID: 1b4c52e33cc6
Revises: 201c3f33e44c
Create Date: 2013-07-17 23:12:39.506912

"""

# revision identifiers, used by Alembic.
revision = '1b4c52e33cc6'
down_revision = '201c3f33e44c'

from alembic import op
import sqlalchemy as sa

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('objectives',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('modified_by_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('url', sa.String(length=250), nullable=True),
    sa.Column('slug', sa.String(length=250), nullable=False),
    sa.Column('title', sa.String(length=250), nullable=False),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('context_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['context_id'], ['contexts.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('objective_controls',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('modified_by_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('objective_id', sa.Integer(), nullable=True),
    sa.Column('control_id', sa.Integer(), nullable=True),
    sa.Column('context_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['context_id'], ['contexts.id'], ),
    sa.ForeignKeyConstraint(['control_id'], ['controls.id'], ),
    sa.ForeignKeyConstraint(['objective_id'], ['objectives.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('section_objectives',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('modified_by_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('section_id', sa.Integer(), nullable=True),
    sa.Column('objective_id', sa.Integer(), nullable=True),
    sa.Column('context_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['context_id'], ['contexts.id'], ),
    sa.ForeignKeyConstraint(['objective_id'], ['objectives.id'], ),
    sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('section_objectives')
    op.drop_table('objective_controls')
    op.drop_table('objectives')
    ### end Alembic commands ###
