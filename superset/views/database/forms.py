# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
"""Contains the logic to create cohesive forms on the explore view"""
from tokenize import Number
from typing import List

from flask_appbuilder.fieldwidgets import BS3TextFieldWidget
from flask_appbuilder.forms import DynamicForm
from flask_babel import lazy_gettext as _
from flask_wtf.file import FileAllowed, FileField, FileRequired, FileSize
from wtforms import (
    BooleanField,
    IntegerField,
    MultipleFileField,
    SelectField,
    StringField,
)
from wtforms.ext.sqlalchemy.fields import QuerySelectField
from wtforms.validators import DataRequired, Length, NumberRange, Optional, Regexp

from superset import app, db, security_manager
from superset.forms import (
    CommaSeparatedListField,
    filter_not_empty_values,
    JsonListField,
)
from superset.models.core import Database

config = app.config


class UploadToDatabaseForm(DynamicForm):
    # pylint: disable=E0211
    def file_allowed_dbs() -> List[Database]:  # type: ignore
        file_enabled_dbs = (
            db.session.query(Database).filter_by(allow_file_upload=True).all()
        )
        return [
            file_enabled_db
            for file_enabled_db in file_enabled_dbs
            if UploadToDatabaseForm.at_least_one_schema_is_allowed(file_enabled_db)
            and UploadToDatabaseForm.is_engine_allowed_to_file_upl(file_enabled_db)
        ]

    @staticmethod
    def at_least_one_schema_is_allowed(database: Database) -> bool:
        """
        If the user has access to the database or all datasource
            1. if schemas_allowed_for_file_upload is empty
                a) if database does not support schema
                    user is able to upload csv without specifying schema name
                b) if database supports schema
                    user is able to upload csv to any schema
            2. if schemas_allowed_for_file_upload is not empty
                a) if database does not support schema
                    This situation is impossible and upload will fail
                b) if database supports schema
                    user is able to upload to schema in schemas_allowed_for_file_upload
        elif the user does not access to the database or all datasource
            1. if schemas_allowed_for_file_upload is empty
                a) if database does not support schema
                    user is unable to upload csv
                b) if database supports schema
                    user is unable to upload csv
            2. if schemas_allowed_for_file_upload is not empty
                a) if database does not support schema
                    This situation is impossible and user is unable to upload csv
                b) if database supports schema
                    user is able to upload to schema in schemas_allowed_for_file_upload
        """
        if security_manager.can_access_database(database):
            return True
        schemas = database.get_schema_access_for_file_upload()
        if schemas and security_manager.get_schemas_accessible_by_user(
            database, schemas, False
        ):
            return True
        return False

    @staticmethod
    def is_engine_allowed_to_file_upl(database: Database) -> bool:
        """
        This method is mainly used for existing Gsheets and Clickhouse DBs
        that have allow_file_upload set as True but they are no longer valid
        DBs for file uploading.
        New GSheets and Clickhouse DBs won't have the option to set
        allow_file_upload set as True.
        """
        if database.db_engine_spec.supports_file_upload:
            return True
        return False


class CsvToDatabaseForm(UploadToDatabaseForm):
    name = StringField(
        _("Table Name"),
        description=_(
            "Name of table to be created from csv data. Must be alphanumeric and can contain only (_) in between"
        ),
        validators=[
            DataRequired(),
            Regexp(
                r"^([a-z])[a-z0-9_]+$",
                message=_(
                    "Table name cannot contain a schema. Must be alphanumeric, should start with a letter, must be in lower case and can contain (_) in between"
                ),
            ),
        ],
        widget=BS3TextFieldWidget(),
    )
    csv_file = FileField(
        _("CSV File"),
        description=_(
            "Select a CSV file to be uploaded to a database. Max Size of the file should be "
            + str(config["CSV_MAX_SIZES"] / 1048576)
            + " MB and the accepted extensions are: "
            "%(allowed_extensions)s",
            allowed_extensions=", ".join(
                config["ALLOWED_EXTENSIONS"].intersection(config["CSV_EXTENSIONS"])
            ),
        ),
        validators=[
            FileRequired(),
            FileSize(
                config["CSV_MAX_SIZES"],
                message="File size must not exceed the limit: "
                + str(config["CSV_MAX_SIZES"] / 1048576)
                + "MB",
            ),
            FileAllowed(
                config["ALLOWED_EXTENSIONS"].intersection(config["CSV_EXTENSIONS"]),
                _(
                    "Only the following file extensions are allowed: "
                    "%(allowed_extensions)s",
                    allowed_extensions=", ".join(
                        config["ALLOWED_EXTENSIONS"].intersection(
                            config["CSV_EXTENSIONS"]
                        )
                    ),
                ),
            ),
        ],
    )
    con = QuerySelectField(
        _("Database"),
        query_factory=UploadToDatabaseForm.file_allowed_dbs,
        get_pk=lambda a: a.id,
        get_label=lambda a: a.database_name,
    )
    schema = StringField(
        _("Schema"),
        description=_("Specify a schema (if database flavor supports this)."),
        validators=[Optional()],
        widget=BS3TextFieldWidget(),
    )
    sep = StringField(
        _("Delimiter"),
        description=_("Delimiter used by CSV file (for whitespace use \\s+)."),
        validators=[DataRequired()],
        widget=BS3TextFieldWidget(),
    )
    if_exists = SelectField(
        _("Table Exists"),
        description=_(
            "If table exists do one of the following: "
            "Fail (do nothing), Replace (drop and recreate table) "
            "or Append (insert data)."
        ),
        choices=[
            ("fail", _("Fail")),
            ("replace", _("Replace")),
            ("append", _("Append")),
        ],
        validators=[DataRequired()],
    )
    header = IntegerField(
        _("Header Row"),
        description=_(
            "Row containing the headers to use as "
            "column names (0 is first line of data). "
            "Leave empty if there is no header row."
        ),
        validators=[Optional(), NumberRange(min=0)],
        widget=BS3TextFieldWidget(),
    )
    index_col = IntegerField(
        _("Index Column"),
        description=_(
            "Column to use as the row labels of the "
            "dataframe. Leave empty if no index column."
        ),
        validators=[Optional(), NumberRange(min=0)],
        widget=BS3TextFieldWidget(),
    )
    mangle_dupe_cols = BooleanField(
        _("Mangle Duplicate Columns"),
        description=_('Specify duplicate columns as "X.0, X.1".'),
    )
    usecols = JsonListField(
        _("Use Columns"),
        default=None,
        description=_(
            "Json list of the column names that should be read. "
            "If not None, only these columns will be read from the file."
        ),
        validators=[Optional()],
    )
    skipinitialspace = BooleanField(
        _("Skip Initial Space"), description=_("Skip spaces after delimiter.")
    )
    skiprows = IntegerField(
        _("Skip Rows"),
        description=_("Number of rows to skip at start of file."),
        validators=[Optional(), NumberRange(min=0)],
        widget=BS3TextFieldWidget(),
    )
    nrows = IntegerField(
        _("Rows to Read"),
        description=_(
            "Number of rows of file to read. Minimum "
            + str(config["CSV_MIN_ROWS"])
            + " and Maximum "
            + str(config["CSV_MAX_ROWS"])
            + " rows are allowed"
        ),
        validators=[
            DataRequired(),
            NumberRange(min=config["CSV_MIN_ROWS"]),
            NumberRange(max=config["CSV_MAX_ROWS"]),
        ],
        widget=BS3TextFieldWidget(),
    )
    skip_blank_lines = BooleanField(
        _("Skip Blank Lines"),
        description=_("Skip blank lines rather than interpreting them as NaN values."),
    )
    parse_dates = CommaSeparatedListField(
        _("Parse Dates"),
        description=_(
            "A comma separated list of columns that should be parsed as dates."
        ),
        filters=[filter_not_empty_values],
    )
    infer_datetime_format = BooleanField(
        _("Infer Datetime Format"),
        description=_("Use Pandas to interpret the datetime format automatically."),
    )
    decimal = StringField(
        _("Decimal Character"),
        default=".",
        description=_("Character to interpret as decimal point."),
        validators=[Optional(), Length(min=1, max=1)],
        widget=BS3TextFieldWidget(),
    )
    index = BooleanField(
        _("Dataframe Index"), description=_("Write dataframe index as a column.")
    )
    index_label = StringField(
        _("Column Label(s)"),
        description=_(
            "Column label for index column(s). If None is given "
            "and Dataframe Index is True, Index Names are used."
        ),
        validators=[Optional()],
        widget=BS3TextFieldWidget(),
    )
    null_values = JsonListField(
        _("Null values"),
        default=config["CSV_DEFAULT_NA_NAMES"],
        description=_(
            "Json list of the values that should be treated as null. "
            'Examples: [""], ["None", "N/A"], ["nan", "null"]. '
            "Warning: Hive database supports only single value. "
            'Use [""] for empty string.'
        ),
    )


class ExcelToDatabaseForm(UploadToDatabaseForm):
    name = StringField(
        _("Table Name"),
        description=_("Name of table to be created from excel data."),
        validators=[
            DataRequired(),
            Regexp(r"^[^\.]+$", message=_("Table name cannot contain a schema")),
        ],
        widget=BS3TextFieldWidget(),
    )
    excel_file = FileField(
        _("Excel File"),
        description=_("Select a Excel file to be uploaded to a database."),
        validators=[
            FileRequired(),
            FileAllowed(
                config["ALLOWED_EXTENSIONS"].intersection(config["EXCEL_EXTENSIONS"]),
                _(
                    "Only the following file extensions are allowed: "
                    "%(allowed_extensions)s",
                    allowed_extensions=", ".join(
                        config["ALLOWED_EXTENSIONS"].intersection(
                            config["EXCEL_EXTENSIONS"]
                        )
                    ),
                ),
            ),
        ],
    )

    sheet_name = StringField(
        _("Sheet Name"),
        description=_("Strings used for sheet names (default is the first sheet)."),
        validators=[Optional()],
        widget=BS3TextFieldWidget(),
    )

    con = QuerySelectField(
        _("Database"),
        query_factory=UploadToDatabaseForm.file_allowed_dbs,
        get_pk=lambda a: a.id,
        get_label=lambda a: a.database_name,
    )
    schema = StringField(
        _("Schema"),
        description=_("Specify a schema (if database flavor supports this)."),
        validators=[Optional()],
        widget=BS3TextFieldWidget(),
    )
    if_exists = SelectField(
        _("Table Exists"),
        description=_(
            "If table exists do one of the following: "
            "Fail (do nothing), Replace (drop and recreate table) "
            "or Append (insert data)."
        ),
        choices=[
            ("fail", _("Fail")),
            ("replace", _("Replace")),
            ("append", _("Append")),
        ],
        validators=[DataRequired()],
    )
    header = IntegerField(
        _("Header Row"),
        description=_(
            "Row containing the headers to use as "
            "column names (0 is first line of data). "
            "Leave empty if there is no header row."
        ),
        validators=[Optional(), NumberRange(min=0)],
        widget=BS3TextFieldWidget(),
    )
    index_col = IntegerField(
        _("Index Column"),
        description=_(
            "Column to use as the row labels of the "
            "dataframe. Leave empty if no index column."
        ),
        validators=[Optional(), NumberRange(min=0)],
        widget=BS3TextFieldWidget(),
    )
    mangle_dupe_cols = BooleanField(
        _("Mangle Duplicate Columns"),
        description=_('Specify duplicate columns as "X.0, X.1".'),
    )
    skiprows = IntegerField(
        _("Skip Rows"),
        description=_("Number of rows to skip at start of file."),
        validators=[Optional(), NumberRange(min=0)],
        widget=BS3TextFieldWidget(),
    )
    nrows = IntegerField(
        _("Rows to Read"),
        description=_("Number of rows of file to read."),
        validators=[Optional(), NumberRange(min=0)],
        widget=BS3TextFieldWidget(),
    )
    parse_dates = CommaSeparatedListField(
        _("Parse Dates"),
        description=_(
            "A comma separated list of columns that should be parsed as dates."
        ),
        filters=[filter_not_empty_values],
    )
    decimal = StringField(
        _("Decimal Character"),
        default=".",
        description=_("Character to interpret as decimal point."),
        validators=[Optional(), Length(min=1, max=1)],
        widget=BS3TextFieldWidget(),
    )
    index = BooleanField(
        _("Dataframe Index"), description=_("Write dataframe index as a column.")
    )
    index_label = StringField(
        _("Column Label(s)"),
        description=_(
            "Column label for index column(s). If None is given "
            "and Dataframe Index is True, Index Names are used."
        ),
        validators=[Optional()],
        widget=BS3TextFieldWidget(),
    )
    null_values = JsonListField(
        _("Null values"),
        default=config["CSV_DEFAULT_NA_NAMES"],
        description=_(
            "Json list of the values that should be treated as null. "
            'Examples: [""], ["None", "N/A"], ["nan", "null"]. '
            "Warning: Hive database supports only single value. "
            'Use [""] for empty string.'
        ),
    )


class ColumnarToDatabaseForm(UploadToDatabaseForm):
    name = StringField(
        _("Table Name"),
        description=_("Name of table to be created from columnar data."),
        validators=[
            DataRequired(),
            Regexp(r"^[^\.]+$", message=_("Table name cannot contain a schema")),
        ],
        widget=BS3TextFieldWidget(),
    )
    columnar_file = MultipleFileField(
        _("Columnar File"),
        description=_("Select a Columnar file to be uploaded to a database."),
        validators=[
            DataRequired(),
            FileAllowed(
                config["ALLOWED_EXTENSIONS"].intersection(
                    config["COLUMNAR_EXTENSIONS"]
                ),
                _(
                    "Only the following file extensions are allowed: "
                    "%(allowed_extensions)s",
                    allowed_extensions=", ".join(
                        config["ALLOWED_EXTENSIONS"].intersection(
                            config["COLUMNAR_EXTENSIONS"]
                        )
                    ),
                ),
            ),
        ],
    )

    con = QuerySelectField(
        _("Database"),
        query_factory=UploadToDatabaseForm.file_allowed_dbs,
        get_pk=lambda a: a.id,
        get_label=lambda a: a.database_name,
    )
    schema = StringField(
        _("Schema"),
        description=_("Specify a schema (if database flavor supports this)."),
        validators=[Optional()],
        widget=BS3TextFieldWidget(),
    )
    if_exists = SelectField(
        _("Table Exists"),
        description=_(
            "If table exists do one of the following: "
            "Fail (do nothing), Replace (drop and recreate table) "
            "or Append (insert data)."
        ),
        choices=[
            ("fail", _("Fail")),
            ("replace", _("Replace")),
            ("append", _("Append")),
        ],
        validators=[DataRequired()],
    )
    usecols = JsonListField(
        _("Use Columns"),
        default=None,
        description=_(
            "Json list of the column names that should be read. "
            "If not None, only these columns will be read from the file."
        ),
        validators=[Optional()],
    )
    index = BooleanField(
        _("Dataframe Index"), description=_("Write dataframe index as a column.")
    )
    index_label = StringField(
        _("Column Label(s)"),
        description=_(
            "Column label for index column(s). If None is given "
            "and Dataframe Index is True, Index Names are used."
        ),
        validators=[Optional()],
        widget=BS3TextFieldWidget(),
    )
