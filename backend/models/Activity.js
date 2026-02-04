/**
 * Activity Model (Reference for database structure)
 * 
 * {
 *   id: string,
 *   teamId: string,
 *   userId: string,
 *   type: 'create_team' | 'join_team' | 'send_message' | 'connect_repo' | 'share_secret' | 'create_team_opening' | 'apply_to_team',
 *   metadata: {
 *     teamName?: string,
 *     projectName?: string,
 *     repoName?: string,
 *     messagePreview?: string,
 *     maskedValue?: string,
 *     userName?: string,
 *     label?: string,
 *     url?: string,
 *     secretName?: string,
 *     source?: string,
 *     type?: string (e.g. 'github')
 *   },
 *   createdAt: Timestamp
 * }
 */

class Activity {
  constructor(id, teamId, userId, type, metadata, createdAt) {
    this.id = id;
    this.teamId = teamId;
    this.userId = userId;
    this.type = type;
    this.metadata = metadata;
    this.createdAt = createdAt;
  }
}

module.exports = Activity;
