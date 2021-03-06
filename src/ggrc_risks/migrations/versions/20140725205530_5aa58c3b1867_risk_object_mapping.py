# Copyright (C) 2015 Reciprocity, Inc - All Rights Reserved
# Unauthorized use, copying, distribution, displaying, or public performance
# of this file, via any medium, is strictly prohibited. All information
# contained herein is proprietary and confidential and may not be shared
# with any third party without the express written consent of Reciprocity, Inc.
# Created By: anze@reciprocitylabs.com
# Maintained By: anze@reciprocitylabs.com

"""Risk Object mapping.

Revision ID: 5aa58c3b1867
Revises: dca3c8d9d68
Create Date: 2014-07-25 20:55:30.848218

"""

# revision identifiers, used by Alembic.
revision = '5aa58c3b1867'
down_revision = 'dca3c8d9d68'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('risk_objects',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('risk_id', sa.Integer(), nullable=False),
    sa.Column('object_id', sa.Integer(), nullable=False),
    sa.Column('object_type', sa.String(length=250), nullable=False),
    sa.Column('status', sa.String(length=250), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('modified_by_id', sa.Integer(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('context_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['context_id'], ['contexts.id'], ),
    sa.ForeignKeyConstraint(['risk_id'], ['risks.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('risk_id', 'object_id', 'object_type')
    )
    op.create_index('fk_risk_objects_contexts', 'risk_objects', ['context_id'], unique=False)
    op.create_index('ix_risk_id', 'risk_objects', ['risk_id'], unique=False)


def downgrade():
    op.drop_index('ix_risk_id', table_name='risk_objects')
    op.drop_index('fk_risk_objects_contexts', table_name='risk_objects')
    op.drop_table('risk_objects')
