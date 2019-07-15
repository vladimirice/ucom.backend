class ProfileSerializer {
  public static getUserFieldsToSave(alias: string | null = null): string[] {
    const set = [
      'id',
      'account_name',
      'first_name',
      'last_name',
      'entity_images',
      'avatar_filename',
      'about',
      'mood_message',
      'created_at',
      'updated_at',
      'personal_website_url',
      'is_tracking_allowed',
    ];

    if (alias === null) {
      return set;
    }

    return set.map(item => `${alias}.${item}`);
  }

  public static getUserSourcesFieldsToSave(): string[] {
    return [
      'source_url',
      'is_official',
      'source_type_id',
      'created_at',
      'updated_at',
    ];
  }
}

export = ProfileSerializer;
